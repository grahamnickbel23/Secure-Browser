import bcrypt from "bcrypt";
import studentModel from "../../model/student model.js";
import localAuth from "../../utils/localAuth utils.js";
import tokenAndCookies from "../../utils/tokenAndCookies utils.js";

export default class studentAuth {
    // create account
    static async create(req, res) {

        // get all the data first
        const data = req.body;
        const userInfo = await localAuth.doesUserExisit(req, data);
        if (userInfo) return res.status(409).json({ success: false, message: `account aleady exisit` });

        // if all ok hash pasword
        data.password = await bcrypt.hash(data.password, 10);
        console.log('info till here')

        // save info into db
        const newUser = studentModel(data);
        await newUser.save();

        // if all ok return ok
        return res.status(200).json({
            success: true,
            message: `account created successfully`
        });
    }

    // login account
    static async login(req, res) {

        // get the data first
        const data = req.body;
        if (!data.email || !data.password) return res.status(400).json({
            sucess: false,
            message: `incomplete input info`
        });

        // cheak if the user exisit
        req.target = 'student';
        const userInfo = await localAuth.doesUserExisit(req, data);
        if (userInfo == null) return res.status(404).json({
            success: false,
            message: `user does not exisit`
        });

        // if all exisit cheak password
        const doesPasswordSame = await bcrypt.compare(data.password, userInfo.password);
        if (!doesPasswordSame) return res.status(400).json({
            success: true,
            message: `password does not match`
        });

        // send cookies
        await tokenAndCookies.acessTokenAndCookies(userInfo, req.target, res);

        // if all ok send ok
        return res.status(200).json({
            success: true,
            message: `send cookies succesfully`
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

        // get the incoming info
        const user = await studentModel.findById(req.token.userId).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        return res.status(200).json({
            success: true,
            data: user
        });
    }

    // update account 
    static async update(req, res) {

        // get the data abd verlidate it
        const { targetField, newData, email } = req.body;
        if (!targetField || newData === undefined || !email) { return res.status(400).json({ success: false, message: "targetField and newVal are required" })}

        // cheak if the student exisit 
        req.target = 'student';
        const userInfo = await localAuth.doesUserExisit(req, { email });
        if (!userInfo) return res.status(404).json({ success: false, message: `user doesn't exisit`});

        // Whitelist allowed fields
        const allowedFields = [
            "name",
            "email",
            "department",
            "password"
        ];

        if (!allowedFields.includes(targetField)) { return res.status(403).json({ success: false, message: "Field update not allowed" })}

        let valueToUpdate = newData;

        // hash it if it is password
        if (targetField === "password") { valueToUpdate = await bcrypt.hash(newData, 10)}

        const updatedUser = await studentModel.findByIdAndUpdate( userInfo._id,
                { [targetField]: valueToUpdate },
                { new: true }
            )
            .select("-password");

        if (!updatedUser) { return res.status(404).json({success: false, message: "Student not found" })}

        return res.status(200).json({
            success: true,
            data: updatedUser
        });
    }

    // delete account
    static async delete(req, res) {

        // get the data
        const { email } = req.body;
        req.target = 'student';
        const userInfo = await localAuth.doesUserExisit(req, { email });
        if (!userInfo) return res.status(404).json({ success: false, message: `user doesn't exist`});
        const deleted = await studentModel.findByIdAndDelete(userInfo._id);

        if (!deleted)
            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        res.clearCookie("access_token");

        return res.status(200).json({
            success: true,
            message: "Account deleted"
        });
    }
}