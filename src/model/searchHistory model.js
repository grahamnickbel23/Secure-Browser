import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema({

    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "teacherModel",
        required: true,
        index: true
    },

    profileId: {
        type: String,
        required: true
    },

    profileType: {
        type: String,
        enum: ["student", "teacher"],
        required: true
    },

    profileName: {
        type: String,
        required: true
    },

    profileEmail: {
        type: String,
        required: true
    },

    searchedAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 7  // TTL = 7 days
    }

}, { timestamps: false });

export default mongoose.model("searchHistoryModel", searchHistorySchema);