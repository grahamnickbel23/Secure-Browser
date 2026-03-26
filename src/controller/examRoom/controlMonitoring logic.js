import examModel from "../../model/exam model.js";
import fs from "fs";
import path from "path";
import db from "../../../connectSql.js";
import { SQL } from "../../../sqlLoad.js";
import redisClient from "../../../connectRedis.js";
import exam from "./examRoom logic.js";

export default class monitoring {

    // method to start monitoring
    static async start(req, res) {

        // get the incmong info
        const { examId } = req.body;
        if (!examId) return res.status(400).json({ success: false, message: "examId required" });

        // cheak if the request if from teacher
        if (req.token.role != 'teacher') return res.status(403).json({ success: false, message: `access denied` });

        // load exam from Mongo
        const examInfo = await examModel.findOne(
            examId.toString().length === 6
                ? { code: examId }
                : { _id: examId }
        );

        // return 404 if no exam was there
        if (!examInfo) return res.status(404).json({ success: false, message: "Exam not found" });

        // prevent double start
        if (examInfo.isActive) return res.status(400).json({ success: false, message: "Exam already active" });


        // download exam room locally
        await exam.download(examId);

        // activate exam locally
        const now = Date.now();
        await new Promise((resolve, reject) => {
            db.run(
                SQL.activateExam,
                [now, examInfo._id.toString()],
                err => err ? reject(err) : resolve()
            );
        });

        // activate exam in Mongo
        examInfo.isActive = true;
        examInfo.examTime = new Date(now);
        await examInfo.save();

        return res.status(200).json({
            success: true,
            message: "Exam monitoring started",
            data: {
                examCode: examInfo.code,
                duration: examInfo.duration
            }
        });

    }

    // method to read exam session info
    static async read(req, res) {

        // get the user input and valiadate
        const { examId } = req.body;
        if (!examId) return res.status(400).json({ success: false, message: "examId required" });

        // access control for teacher
        if (req.token.role !== "teacher") return res.status(403).json({ success: false, message: "access denied" });

        // find exam using exam CODE
        const exam = await new Promise((resolve, reject) => {

            db.get(
                SQL.readExam,
                [examId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            )

        });

        if (!exam)
            return res.status(404).json({
                success: false,
                message: "Exam not cached locally"
            });

        // now load students using internal id
        const students = await new Promise((resolve, reject) => {

            db.all(
                SQL.readStudentsByExam,
                [exam.id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            )

        });

        return res.status(200).json({
            success: true,
            data: {
                exam,
                students
            }
        });

    }

    // method to stop monitoring
    static async stop(req, res) {

        // take user input
        const { examId } = req.body;
        if (!examId) return res.status(400).json({ success: false, message: "examId required" });

        // teacher access control
        if (req.token.role !== "teacher") return res.status(403).json({ success: false, message: "access denied" });

        // find exam
        const examInfo = await examModel.findOne(examId.toString().length === 6 ? { code: examId } : { _id: examId });

        // send 404 if exam were not there
        if (!examInfo) return res.status(404).json({ success: false, message: "Exam not found" });

        // exam must be active to stop
        if (!examInfo.isActive)
            return res.status(400).json({
                success: false,
                message: "Exam is not active"
            });


        // delete students from local db
        await new Promise((resolve, reject) => {
            db.run(
                SQL.deleteStudentsByExam,
                [examInfo._id.toString()],
                err => err ? reject(err) : resolve()
            );
        });

        // delete exam from local db
        await new Promise((resolve, reject) => {
            db.run(
                SQL.deleteExam,
                [examInfo._id.toString()],
                err => err ? reject(err) : resolve()
            );
        });

        // Cleanup screenshots filesystem
        const screenshotDir = path.join("screenshots", examInfo._id.toString());
        if (fs.existsSync(screenshotDir)) {
            fs.rmSync(screenshotDir, { recursive: true, force: true });
        }

        // Delete screenshot records from local db
        await new Promise((resolve, reject) => {
            db.run(
                SQL.deleteScreenshotsByExam,
                [examInfo._id.toString()],
                err => err ? reject(err) : resolve()
            );
        });

        // delete all the redis info
        let cursor = "0";

        do {

            const { cursor: nextCursor, keys } = await redisClient.scan(cursor, {
                MATCH: "session:*",
                COUNT: 100
            });

            cursor = nextCursor;

            // delete all key one by one
            for (const key of keys) {

                const sessionRaw = await redisClient.get(key);
                if (!sessionRaw) continue;
                const session = JSON.parse(sessionRaw);

                // normalize comparison
                if (String(session.examId) === String(examInfo._id)) {
                    await redisClient.del(key);
                }

            }

        } while (cursor !== "0");

        // deactivate exam in Mongo
        examInfo.isActive = false;
        await examInfo.save();

        return res.status(200).json({
            success: true,
            message: `Exam monitoring stopped for id: ${examId}`
        });
    }
}