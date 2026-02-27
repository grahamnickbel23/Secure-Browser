import teacherModel from "../model/teacher model.js";

export default async function adminOnly(req, res, next) {

    try {

        // bypass for root admin
        if (req.body?.adminEmail === process.env.ROOT_ADMIN) { next (); return };

        // Must be teacher
        if (req.token.role !== "teacher") return res.status(403).json({ success: false, message: "Access denied: Teachers only" });

        // Must have admin flag in DB
        const teacher = await teacherModel.findById(req.token.userId);

        if (!teacher || !teacher.admin) return res.status(403).json({ success: false, message: "Admin privileges required" });

        next();

    } catch (error) {

        console.log(`error: ${error.message}`);

        return res.status(500).json({
            success: false,
            message: "Authorization check failed",
            error: error.message
        });
    }
}