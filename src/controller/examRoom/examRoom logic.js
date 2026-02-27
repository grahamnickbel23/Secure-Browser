import cryptoRandomString from "crypto-random-string";
import examModel from "../../model/exam model.js";

export default class exam {

    // create exam
    static async create(req, res, next) {

        // get the data and do validation
        const data = req.body;
        if (!data.name || !data.url || !data.examTime || !data.duration) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        let attempts = 0, newExam;

        while (attempts < 150) {

            const code = Number(cryptoRandomString({ length: 6, type: "numeric" }));
            
            newExam = new examModel({
                ...data,
                code,
                creatorId: req.token.userId,
                isActive: true
            });

            try {
                await newExam.save();
                break; // success
            } catch (err) {

                // If duplicate code, retry
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
            .findById(req.body.examId)
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

        // get the incoming data
        const data = req.body;

        // verify if the exam room exisit
        const exam = await examModel.findById(data.examId);
        if (!exam) return res.status(404).json({ success: false });

        if (exam.creatorId.toString() !== req.token.userId)
            return res.status(403).json({
                success: false,
                message: "Not allowed"
            });

        const updated = await examModel.findByIdAndUpdate(
            data.examId,
            req.body,
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

        const exam = await examModel.findById(data.examId);
        if (!exam) return res.status(404).json({ success: false });

        if (exam.creatorId.toString() !== req.token.userId)
            return res.status(403).json({
                success: false,
                message: "Not allowed"
            });

        await examModel.findByIdAndDelete(data.examId);

        return res.status(200).json({
            success: true,
            message: "Exam deleted"
        });
    }
}