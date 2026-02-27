import jwt from "jsonwebtoken";

export default async function verifyJWT(req, res, next) {

    try {

        // bypass for root admin
        if (req.body?.adminEmail === process.env.ROOT_ADMIN) { next (); return };

        // Get token from cookies
        const token = req.cookies?.access_token;
        if (!token) return res.status(401).json({ success: false, message: "Access token missing" });

        // Verify token
        req.token = jwt.verify(
            token,
            process.env.JWT_KEY
        );

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
            error: error.message
        });
    }
}