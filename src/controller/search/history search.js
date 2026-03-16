import studentModel from "../../model/student model.js";
import teacherModel from "../../model/teacher model.js";
import searchHistoryModel from "../../model/searchHistory model.js";

export default class SearchHistory {

    // create history
    static async create(req, res) {

        // get the incoming info
        const { profileId, profileType } = req.body;
        if (!profileId || !profileType) return res.status(400).json({ success: false, message: "Profile id and type required" });

        // clasify
        if (!["student", "teacher"].includes(profileType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid profile type"
            });
        }

        let user;

        // Fetch profile to get correct snapshot info
        if (profileType === "student") {

            user = await studentModel.findOne({ enrollmentId: profileId }).select("name email").lean();

        } else {

            user = await teacherModel.findById(profileId).select("name email").lean();
        }

        // return 404 if admin profile not found
        if (!user) return res.status(404).json({ success: false, message: "Profile not found" });

        await searchHistoryModel.findOneAndUpdate(
            {
                adminId: req.token.userId,
                profileId: profileId.toString(),
                profileType
            },
            {
                profileName: user.name,
                profileEmail: user.email,
                searchedAt: new Date()
            },
            { upsert: true, new: true }
        );

        return res.status(201).json({
            success: true,
            message: "Search history saved"
        });
    }

    // list all history of the an account
    static async list(req, res) {

        const history = await searchHistoryModel
            .find({ adminId: req.token.userId })
            .sort({ searchedAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: history
        });
    }

    static async delete(req, res) {

        // get the incoming user info
        const { historyId } = req.body;
        if (!historyId) return res.status(400).json({ success: false, message: "History id required" });

        // delete the doc
        const deleted = await searchHistoryModel.findOneAndDelete({
            _id: historyId,
            adminId: req.token.userId
        });

        // return 404 if not found
        if (!deleted) return res.status(404).json({ success: false, message: "History not found" });

        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: "History deleted"
        });
    }
}