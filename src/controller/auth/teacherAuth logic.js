import bcrypt from "bcrypt";
import teacherModel from "../../model/teacher model.js";
import examModel from "../../model/exam model.js";
import localAuth from "../../utils/localAuth utils.js";
import tokenAndCookies from "../../utils/tokenAndCookies utils.js";

export default class teacherAuth {

    // create account
    static async create(req, res) {

        // get the incming info and test if user exisist
        const data = req.body;
        const userInfo = await localAuth.doesUserExisit(req, data);
        if (userInfo != null) return res.status(409).json({ success: false, message: "Account already exists" });

        // if all ok hash password
        data.password = await bcrypt.hash(data.password, 10);

        const newUser = new teacherModel(data);
        await newUser.save();

        return res.status(200).json({
            success: true,
            message: "Teacher account created successfully"
        });
    }

    // login
    static async login(req, res) {

        // get the incoming user data and cheak for json intigrity
        const data = req.body;
        if (!data.email || !data.password) return res.status(400).json({ success: false, message: "Incomplete input info" });

        // if user does not exisit send error
        req.target = "teacher";
        const userInfo = await localAuth.doesUserExisit(req, data);
        if (!userInfo) return res.status(404).json({ success: false, message: "User does not exist" });

        // cheak passwprd and return error if not matched
        const doesPasswordSame = await bcrypt.compare(data.password, userInfo.password);
        if (!doesPasswordSame) return res.status(400).json({ success: false, message: "Password does not match" });

        // if all ok send acess token
        await tokenAndCookies.acessTokenAndCookies(userInfo, req.target, res);

        // if all ok return ok
        return res.status(200).json({
            success: true,
            message: "Login successful"
        });
    }

    // logout
    static async logout(req, res) {

        res.clearCookie("access_token", {
            httpOnly: true,
            sameSite: "Lax"
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    }

    // read account
    static async read(req, res) {

        // get teacher
        const user = await teacherModel
            .findById(req.token.userId)
            .select("-password");

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // get classrooms created by teacher
        const classrooms = await examModel
            .find({ creatorId: user._id })
            .select("name")
            .lean();

        // format into key-value pair
        const examClassrooms = classrooms.map(c => ({
            id: c._id,
            name: c.name
        }));

        return res.status(200).json({
            success: true,
            data: {
                teacher: user,
                classrooms: examClassrooms
            }
        });
    }

    // update account
    static async update(req, res) {

        const { targetField, newData } = req.body;
        // Validate input presence
        if (!targetField || newData === undefined) { return res.status(400).json({ success: false, message: "targetField and newData are required" }) }

        // Whitelist allowed fields
        const allowedFields = ["name", "email", "department", "password"];
        if (!allowedFields.includes(targetField)) { return res.status(403).json({ success: false, message: "Field update not allowed" }) }

        let updateValue = newData;

        // If updating password hash it
        if (targetField === "password") { updateValue = await bcrypt.hash(newData, 10) }

        // Perform update
        const updatedUser = await teacherModel.findByIdAndUpdate(req.token.userId,
            { [targetField]: updateValue },
            { new: true }
        )
            .select("-password");

        if (!updatedUser) { return res.status(404).json({ success: false, message: "User not found" }) }

        return res.status(200).json({
            success: true,
            data: updatedUser
        });
    }

    // delete account
    static async delete(req, res) {

        const token = req.token;
        const deleted = await teacherModel.findByIdAndDelete(token.userId);

        // if not exixit return error
        if (!deleted)
            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        res.clearCookie("access_token");

        // if all ok return ok
        return res.status(200).json({
            success: true,
            message: "Account deleted"
        });
    }
}