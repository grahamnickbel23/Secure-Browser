import { WebSocketServer } from "ws";
import db from "./connectSql.js";

// Registry to store connections by examCode
const clientRegistry = new Map();

/**
 * Send a message to all teachers monitoring a specific exam.
 * @param {string|number} examCode 
 * @param {object} data 
 */
export const broadcastToExam = (examCode, data) => {
    const clients = clientRegistry.get(examCode.toString());
    if (clients) {
        const message = JSON.stringify(data);
        clients.forEach(ws => {
            if (ws.readyState === 1) { // 1 = OPEN
                ws.send(message);
            }
        });
    }
};

export default function initWebSocket(server) {

    const wss = new WebSocketServer({ server, path: "/monitoring" });

    wss.on("connection", (ws, req) => {

        ws.send(JSON.stringify({
            type: "connected",
            message: "websocket connected successfully, awaiting join message"
        }));

        let currentExamCode = null;
        let interval = null;

        ws.on("message", (message) => {
            try {
                const parsedMsg = JSON.parse(message.toString());

                if (parsedMsg.type === "join" && parsedMsg.examCode) {
                    const examCodeStr = parsedMsg.examCode.toString();
                    currentExamCode = examCodeStr;
                    
                    console.log(`teacher joined exam ${examCodeStr} via JSON input`);

                    // Register client
                    if (!clientRegistry.has(examCodeStr)) {
                        clientRegistry.set(examCodeStr, new Set());
                    }
                    clientRegistry.get(examCodeStr).add(ws);

                    ws.send(JSON.stringify({
                        type: "connected",
                        message: "websocket ready"
                    }));

                    // Clear any existing interval in case of a re-join
                    if (interval) clearInterval(interval);

                    // start sending updates every 0.5 seconds
                    interval = setInterval(() => {

                        // Get Exam ID locally for the given code
                        db.get('SELECT id, examTime, duration, isActive FROM exams WHERE code = ?', [examCodeStr], (err, examRow) => {
                            if (err) {
                                console.error("WS DB exam error:", err);
                                return;
                            }
                            
                            if (!examRow) return;

                            // Send timer tracking
                            if (examRow.isActive === 1 && examRow.examTime && examRow.duration != null) {
                                const examEndTime = new Date(examRow.examTime).getTime() + (examRow.duration * 1000);
                                const timeLeftMs = Math.max(0, examEndTime - Date.now());
                                ws.send(JSON.stringify({
                                    type: "timer_update",
                                    data: { timeLeftMs }
                                }));
                            }

                            // Fetch block students for this specific exam
                            db.all(
                                `SELECT id, name, email
                                 FROM students
                                 WHERE isBlocked = 1 AND examId = ?`,
                                [examRow.id],
                                (err, blockedRows) => {

                                    if (err) {
                                        console.error("WS DB error:", err);
                                        return;
                                    }

                                    ws.send(JSON.stringify({
                                        type: "blocked_students",
                                        data: blockedRows
                                    }));
                                }
                            );

                        });

                    }, 500);
                }
            } catch (err) {
                console.error("Failed to parse websocket message", err);
            }
        });

        ws.on("close", () => {
            if (currentExamCode) {
                console.log(`teacher disconnected from exam ${currentExamCode}`);
                const clients = clientRegistry.get(currentExamCode);
                if (clients) {
                    clients.delete(ws);
                    if (clients.size === 0) {
                        clientRegistry.delete(currentExamCode);
                    }
                }
            } else {
                console.log(`teacher connection closed`);
            }
            
            if (interval) clearInterval(interval);
        });

    });

}