import teacherModel from "../../model/teacher model.js";
import studentModel from "../../model/student model.js";
import examModel from "../../model/exam model.js";

export default class search {

    // globla search logic
    static async globalSearch(req, res) {

        // get the icoming queary
        const { query } = req.body;
        if (!query || query.trim() === "") return res.status(400).json({ success: false, message: "Search query required" });

        // trim and clsifay queary
        const q = query.trim();
        const isNumeric = /^\d+$/.test(q);
        const isEmail = q.includes("@");
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(q);

        const regexStart = new RegExp("^" + q, "i");
        const regexAnywhere = new RegExp(q, "i");

        let studentQuery = {};
        let teacherQuery = {};

        // Flexible intent detection
        if (isNumeric) {
            studentQuery = {
                $or: [
                    { enrollmentId: Number(q) },
                    { name: regexAnywhere },
                    { email: regexAnywhere }
                ]
            };
        }
        else if (isEmail) {
            studentQuery = { email: regexStart };
            teacherQuery = { email: regexStart };
        }
        else if (isObjectId) {
            teacherQuery = {
                $or: [
                    { _id: q },
                    { name: regexAnywhere },
                    { email: regexAnywhere }
                ]
            };
        }
        else {
            studentQuery = {
                $or: [
                    { name: regexAnywhere },
                    { email: regexAnywhere }
                ]
            };

            teacherQuery = {
                $or: [
                    { name: regexAnywhere },
                    { email: regexAnywhere }
                ]
            };
        }

        const students = await studentModel
            .find(studentQuery)
            .select("enrollmentId name email")
            .limit(20)
            .lean();

        const teachers = await teacherModel
            .find(teacherQuery)
            .select("_id name email")
            .limit(20)
            .lean();

        // Ranking logic
        const scoreResult = (item, type) => {

            let score = 0;

            if (type === "student" && isNumeric && item.enrollmentId == q)
                score = 120;

            else if (type === "teacher" && isObjectId && item._id.toString() === q)
                score = 120;

            else if (item.email.toLowerCase() === q.toLowerCase())
                score = 110;

            else if (item.name.toLowerCase() === q.toLowerCase())
                score = 100;

            else if (regexStart.test(item.name))
                score = 80;

            else if (regexStart.test(item.email))
                score = 70;

            else if (regexAnywhere.test(item.name))
                score = 50;

            else if (regexAnywhere.test(item.email))
                score = 40;

            return score;
        };

        const formattedStudents = students.map(s => ({
            type: "student",
            id: s.enrollmentId,
            name: s.name,
            email: s.email,
            score: scoreResult(s, "student")
        }));

        const formattedTeachers = teachers.map(t => ({
            type: "teacher",
            id: t._id,
            name: t.name,
            email: t.email,
            score: scoreResult(t, "teacher")
        }));

        const combined = [...formattedStudents, ...formattedTeachers]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        const finalResults = combined.map(({ score, ...rest }) => rest);

        return res.status(200).json({
            success: true,
            data: finalResults
        });
    }

    // read the profile after search
    static async readProfile(req, res) {

        // get the user info
        const { type, id } = req.body;
        if (!type || !id) return res.status(400).json({ success: false, message: "Type and id required" });

        let user;
        let exams = [];

        if (type === "student") {

            user = await studentModel.findOne({ "enrollmentId": id }).select("-password").lean();
            if (!user) return res.status(404).json({ success: false, message: "Profile not found" });

            // find exams where student is added
            exams = await examModel.find({ students: user._id }).select("name examTime").populate({ path: "creatorId", select: "name" }).lean();

            return res.status(200).json({
                success: true,
                data: {
                    student: user,
                    enrolledExams: exams
                }
            });
        }

        else if (type === "teacher") {

            user = await teacherModel.findById(id).select("-password").lean();

            if (!user) return res.status(404).json({ success: false, message: "Profile not found" });

            // find exams created by teacher
            exams = await examModel.find({ creatorId: user._id }).select("name examTime").populate({ path: "creatorId", select: "name" }).lean();

            return res.status(200).json({
                success: true,
                data: {
                    teacher: user,
                    createdExams: exams,
                    totalCreatedExams: exams.length
                }
            });
        }

        else {
            return res.status(400).json({
                success: false,
                message: "Invalid type"
            });
        }
    }
}