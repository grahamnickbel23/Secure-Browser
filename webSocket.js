import { WebSocketServer } from "ws";
import db from "./connectSql.js";

export default function initWebSocket(server) {

    const wss = new WebSocketServer({ server, path: "/monitoring" });

    wss.on("connection", (ws, req) => {

        ws.send(JSON.stringify({
            type: "connected",
            message: "websocket connected successfully, awaiting join message"
        }));

        let examCode = null;
        let interval = null;

        ws.on("message", (message) => {
            try {
                const parsedMsg = JSON.parse(message.toString());

                if (parsedMsg.type === "join" && parsedMsg.examCode) {
                    examCode = parsedMsg.examCode;
                    console.log(`teacher joined exam ${examCode} via JSON input`);

                    ws.send(JSON.stringify({
                        type: "connected",
                        message: "websocket ready"
                    }));

                    // Clear any existing interval in case of a re-join
                    if (interval) clearInterval(interval);

                    // start sending updates every 0.5 seconds
                    interval = setInterval(() => {

                        // Get Exam ID locally for the given code
                        db.get('SELECT id, examTime, duration, isActive FROM exams WHERE code = ?', [examCode], (err, examRow) => {
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
            if (examCode) console.log(`teacher disconnected from exam ${examCode}`);
            else console.log(`teacher connection closed`);
            
            if (interval) clearInterval(interval);
        });

    });

}