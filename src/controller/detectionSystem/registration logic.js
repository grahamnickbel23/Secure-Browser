import crypto from "crypto";
import fs from "fs";
import path from "path";
import redisClient from "../../../connectRedis.js";
import db from "../../../connectSql.js";
import { SQL } from "../../../sqlLoad.js";
import { broadcastToExam } from "../../../webSocket.js";

export default class session {

    // register the device with account at the start of the exam
    static async start(req, res) {

        // get the incoming info from agent
        const data = req.body;
        if (!data.accountId || !data.examId || !data.device || !data.hardware) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration payload"
            });
        }
        console.log(`registration api called`);

        // Verify that exam exists
        const exam = await new Promise((resolve, reject) => {
            db.get(
                SQL.verifyExam,
                [data.examId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );

        });

        // return error if no exam is found
        if (!exam) return res.status(404).json({ success: false, message: "Exam room not found" });

        // Verify that student is enrolled in the exam room
        const student = await new Promise((resolve, reject) => {

            db.get(
                SQL.verifyStudent,
                [data.accountId, exam.id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );

        });

        // return error if student is not exrolled
        if (!student) return res.status(403).json({ success: false, message: "Student not allowed in this exam" });

        // return error if the exam is not active
        if (!exam.isActive) return res.status(403).json({ success: false, message: "Exam is not active" });

        // Create session
        const sessionId = crypto.randomUUID();
        const secretKey = crypto.randomBytes(32).toString("hex");

        // create redis key of hash
        const sessionKey = `session:${sessionId}`;

        // redis hash
        const sessionData = {
            accountId: data.accountId,
            examId: exam.id,
            secretKey,
            createdAt: Date.now(),
            riskScore: 0
        };

        await redisClient.set(
            sessionKey,
            JSON.stringify(sessionData),
            { EX: (exam.duration * 60 + 10 * 60) }  // exam duration + 10 min
        );

        console.log(`registration api return: sessid: ${sessionId}, secreatkey: ${secretKey}`)

        // return ok if all ok
        return res.status(200).json({
            success: true,
            sessionId,
            secretKey,
            heartbeatInterval: 5000
        });
    }

    // method to block student
    static async block(req, res) {

        // get the info drom the user
        const { examId, studentId } = req.body;
        if (!examId || !studentId)
            return res.status(400).json({
                success: false,
                message: "examId and studentId are required"
            });

        // get internal exam id using exam code
        const exam = await new Promise((resolve, reject) => {

            db.get(
                SQL.getExamIdByCode,
                [examId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );

        });

        // return erro if not ok
        if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

        // block the student
        await new Promise((resolve, reject) => {

            db.run(
                SQL.blockStudent,
                [
                    studentId.toString(),
                    exam.id
                ],
                function (err) {

                    if (err) return reject(err);

                    if (this.changes === 0) {
                        const error = new Error("Student not found for this exam");
                        error.status = 404;
                        return reject(error);
                    }

                    resolve();
                }
            );

        });

        return res.status(200).json({
            success: true,
            examCode: examId,
            studentId,
            isBlocked: true
        });
    }

    // method to store screenshot during block
    static async uploadScreenshot(req, res) {

        // get the student info
        const { examId, studentId } = req.body;

        // error for missing fields
        if (!examId || !studentId || !req.file) return res.status(400).json({ success: false, message: "Missing required fields" });

        // get internal exam id using exam code
        const exam = await new Promise((resolve, reject) => {

            db.get(
                SQL.getExamIdByCode,
                [examId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );

        });

        // return erro if not ok
        if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

        const student = await new Promise((resolve, reject) => {
            db.get(
                SQL.verifyStudent,   // your query
                [studentId, exam.id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!student) return res.status(403).json({ success: false, message: "Student not associated with this exam" });

        // Folder structure: /screenshots/<examId>/
        const dir = path.join("screenshots", exam.id.toString());

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const fileName = `${studentId}_${Date.now()}.png`;
        const filePath = path.join(dir, fileName);

        // Save file to disk
        fs.writeFileSync(filePath, req.file.buffer);

        // Save metadata to DB
        await new Promise((resolve, reject) => {
            db.run(
                SQL.screenshotInsert,
                [studentId, exam.id, filePath, Date.now()],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Trigger WebSocket notification to monitoring teachers
        broadcastToExam(examId, {
            type: "screenshot_recorded",
            data: {
                studentId,
                studentName: student.name,
                examId: exam.id,
                filePath,
                imageUrl: `/screenshots/${exam.id}/${fileName}`, // Relative URL for static serving
                image: req.file.buffer.toString("base64"), // Include base64 image data
                createdAt: Date.now()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Screenshot saved",
            path: filePath
        });
    }

    // method to unblock student
    static async unblock(req, res) {

        // get the info from the user
        const { examId, studentId } = req.body;
        if (!examId || !studentId) return res.status(400).json({ success: false, message: "examId and studentId are required" });

        // get internal exam id using exam code
        const exam = await new Promise((resolve, reject) => {

            db.get(
                SQL.getExamIdByCode,
                [examId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );

        });

        // return error if exam not found
        if (!exam)
            return res.status(404).json({
                success: false,
                message: "Exam not found"
            });

        // unblock the student
        await new Promise((resolve, reject) => {

            db.run(
                SQL.unblockStudent,
                [
                    studentId.toString(),
                    exam.id
                ],
                function (err) {

                    if (err) return reject(err);

                    if (this.changes === 0) {
                        const error = new Error("Student not found for this exam");
                        error.status = 404;
                        return reject(error);
                    }

                    resolve();
                }
            );

        });

        return res.status(200).json({
            success: true,
            examCode: examId,
            studentId,
            isBlocked: false
        });
    }

    // method to get screenshot links
    static async listScreenshots(req, res) {

        // get the info from the user
        const { examId, studentId } = req.body;
        if (!examId || !studentId) return res.status(400).json({ success: false, message: "examId and studentId are required" });

        // get internal exam id using exam code
        const exam = await new Promise((resolve, reject) => {

            db.get(
                SQL.getExamIdByCode,
                [examId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );

        });

        // return error if exam not found
        if (!exam)
            return res.status(404).json({
                success: false,
                message: "Exam not found"
            });

        // query screenshots
        const screenshots = await new Promise((resolve, reject) => {
            db.all(
                SQL.readScreenshotsByStudent,
                [studentId.toString(), exam.id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        const result = screenshots.map(s => {
            const fileName = path.basename(s.filePath);
            
            return {
                studentId,
                examId: exam.id,
                filePath: s.filePath,
                imageUrl: `/screenshots/${exam.id}/${fileName}`,
                createdAt: s.createdAt
            };
        });

        return res.status(200).json({
            success: true,
            examCode: examId,
            studentId,
            screenshots: result
        });
    }
}