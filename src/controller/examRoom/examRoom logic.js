import cryptoRandomString from "crypto-random-string";
import examModel from "../../model/exam model.js";
import studentModel from "../../model/student model.js";
import db from "../../../connectSql.js";
import { SQL } from "../../../sqlLoad.js";

export default class exam {

    // create exam
    static async create(req, res, next) {

        const { name, url, description, examTime, duration, students } = req.body;
        if (!name || !url || !examTime || !duration) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }
        let studentIds = [];

        if (students && Array.isArray(students) && students.length > 0) {

            const foundStudents = await studentModel
                .find({ email: { $in: students } })
                .select("_id email")
                .lean();

            const foundEmails = foundStudents.map(s => s.email);
            const missingEmails = students.filter(
                email => !foundEmails.includes(email)
            );

            if (missingEmails.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Some students not found",
                    missingEmails
                });
            }

            studentIds = foundStudents.map(s => s._id);
        }

        // Generate exam code
        let attempts = 0, newExam;

        while (attempts < 150) {

            const code = Number(
                cryptoRandomString({ length: 6, type: "numeric" })
            );

            newExam = new examModel({
                name, url, description, examTime, duration, code,
                creatorId: req.token.userId,
                students: studentIds
            });

            try {
                await newExam.save();
                break;
            } catch (err) {

                if (err.code === 11000) {
                    attempts++;
                    continue;
                }

                return next(err);
            }
        }

        if (attempts === 150) {
            return res.status(500).json({
                success: false,
                message: "Failed to generate unique exam code"
            });
        }

        console.log(`create exam api called`)

        return res.status(201).json({
            success: true,
            data: newExam
        });
    }

    // read exams
    static async read(req, res) {

        // cheak if the request if from teacher
        if (req.token.role != 'teacher') return res.status(403).json({ success: false, message: `access denied` });

        const exam = await examModel
            .findOne(req.body.examId.toString().length === 6 ? { "code": req.body.examId } : { "_id": req.body.examId })
            .populate("students", "-password");

        if (!exam)
            return res.status(404).json({
                success: false,
                message: "Exam not found"
            });

        console.log(`exam read api called`);

        return res.status(200).json({
            success: true,
            data: exam
        });

    }

    // student exam
    static async readStudentExam(req, res) {

        // get the user info 
        const { examId } = req.body;
        if (!examId) return res.status(400).json({ success: false, message: "Exam id required" });

        // get student id from token
        const studentId = req.token.userId;

        let enrollmentId;
            const studentInfo = await studentModel.findById(studentId).select("enrollmentId");
            if (!studentInfo) return res.status(403).json({ success: false, message: "Student not found in DB" });
            enrollmentId = studentInfo.enrollmentId;

        // Get internal exam code
        const examRecord = await new Promise((resolve, reject) => {
            db.get(
                SQL.getExamIdByCode,
                [Number(examId)],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                });
        });

        if (!examRecord) return res.status(403).json({ success: false, message: "You are not enrolled in this exam" });

        // Verify student enrollment using enrollmentId
        const studentRecord = await new Promise((resolve, reject) => {
            db.get(
                SQL.verifyStudent,
                [enrollmentId.toString(), examRecord.id],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                });
        });

        // send 404
        if (!studentRecord) return res.status(403).json({ success: false, message: "You are not enrolled in this exam" });

        // send error if blocked
        if (studentRecord.isBlocked === 1 || studentRecord.isBlocked === true) {
            return res.status(403).json({ success: false, message: "You are blocked from this exam" });
        }

        // Fetch URL
        const examDetails = await new Promise((resolve, reject) => {
            db.get(
                SQL.readExam, [examRecord.id],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                });
        });

        if (!examDetails.isActive) return res.status(403).json({ success: false, message: "Exam is not active" });

        // send url if all ok
        return res.status(200).json({
            success: true,
            data: {
                url: examDetails.url
            }
        });

    }

    // update exam
    static async update(req, res) {

        // cheak all the incoming data
        const { examId, targetField, newData } = req.body;
        if (!examId || !targetField) return res.status(400).json({ success: false, message: "Missing examId or targetField" });

        // Allowed editable fields
        const allowedFields = ["name", "url", "examTime", "duration"];
        if (!allowedFields.includes(targetField)) return res.status(400).json({ success: false, message: "Field not allowed to update" });

        // cheak if the exam exisit at all
        const exam = await examModel.findOne(examId.toString().length === 6 ? { "code": examId } : { "_id": examId });
        if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

        // ensure only the creator can chnage the exam room
        if (exam.creatorId.toString() !== req.token.userId)
            return res.status(403).json({
                success: false,
                message: "Not allowed"
            });

        // Dynamic update object
        const updateObject = {
            [targetField]: newData
        };

        const updated = await examModel.findByIdAndUpdate(
            exam._id,
            updateObject,
            { new: true }
        );

        console.log(`exam room update api called`)

        return res.status(200).json({
            success: true,
            data: updated
        });
    }

    // delete exam room
    static async delete(req, res) {

        const data = req.body;
        if (!data.examId) return res.status(400).json({ success: false, message: `examid missing` });

        const exam = await examModel.findOne(data.examId.toString().length === 6 ? { "code": data.examId } : { "_id": data.examId });
        if (!exam) return res.status(404).json({ success: false });

        if (exam.creatorId.toString() !== req.token.userId)
            return res.status(403).json({
                success: false,
                message: "Not allowed"
            });

        await examModel.findByIdAndDelete(exam._id);

        return res.status(200).json({
            success: true,
            message: "Exam deleted"
        });
    }

    // download exam room info
    static async download(examId) {

        // get the all the info from the agent
        const exam = await examModel.findOne(examId.toString().length === 6 ? { code: examId } : { _id: examId })
            .populate("students", "enrollmentId email name")
            .lean();

        // throww error if no exam was there
        if (!exam) {
            const err = new Error("Exam not found");
            err.status = 404;
            throw err;
        }

        await new Promise((resolve, reject) => {
            db.run(
                SQL.examInsert,
                [
                    exam._id.toString(),
                    exam.code,
                    exam.name,
                    exam.url,
                    exam.examTime,
                    exam.duration,
                    exam.isActive ? 1 : 0
                ],
                err => err ? reject(err) : resolve()
            );
        });

        for (const student of exam.students) {

            await new Promise((resolve, reject) => {
                db.run(
                    SQL.studentInsert,
                    [
                        student.enrollmentId.toString(),
                        student.email,
                        student.name,
                        exam._id.toString()
                    ],
                    err => err ? reject(err) : resolve()
                );
            });

        }

        return exam;
    }
}