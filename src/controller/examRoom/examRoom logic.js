import cryptoRandomString from "crypto-random-string";
import examModel from "../../model/exam model.js";
import studentModel from "../../model/student model.js";

export default class exam {

    // create exam
    static async create(req, res, next) {

        const { name, url, examTime, duration, students } = req.body;
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
                name, url, examTime, duration, code,
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

        return res.status(201).json({
            success: true,
            data: newExam
        });
    }

    // read exams
    static async read(req, res) {

        const exam = await examModel
            .findOne({ "code": req.body.examId })
            .populate("students", "-password");

        if (!exam)
            return res.status(404).json({
                success: false,
                message: "Exam not found"
            });

        return res.status(200).json({
            success: true,
            data: exam
        });

    }

    // update exam
    static async update(req, res) {

        // cheak all the incoming data
        const { examId, targetField, newData } = req.body;
        if (!examId || !targetField) return res.status(400).json({ success: false, message: "Missing examId or targetField" });

        // Allowed editable fields
        const allowedFields = [ "name", "url", "examTime", "duration" ];
        if (!allowedFields.includes(targetField)) return res.status(400).json({ success: false, message: "Field not allowed to update" });

        // cheak if the exam exisit at all
        const exam = await examModel.findOne(examId.toString().length === 6 ? { "code" : examId } : { "_id" : examId });
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

        return res.status(200).json({
            success: true,
            data: updated
        });
    }

    // delete exam room
    static async delete(req, res) {

        const data = req.body;
        if (!data.examId) return res.status(400).json({ success: false, message: `examid missing` });

        const exam = await examModel.findOne({ "code" : data.examId });
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
}