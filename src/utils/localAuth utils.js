import studentModel from "../model/student model.js";
import teacherModel from "../model/teacher model.js";

export default class localAuth {

    // doesUserExisit method
    static async doesUserExisit(req, data) {

        // set the veriable
        let user = null;

        if (req.target == 'student') {
            user = await studentModel.findOne({
                $or: [
                    { "enrollmentId": data.enrollmentId },
                    { "email": data.email }
                ]
            })
        } else {
            user = await teacherModel.findOne({
                $or: [
                    { "email": data.email }
                ]
            })
        }

        return user;
    }
}