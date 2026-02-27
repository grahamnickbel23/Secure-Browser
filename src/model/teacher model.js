import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },

    department: {
        type: String,
        required: true
    },

    admin: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    updatedAt: {
        type: Date,
        default: Date.now,
    }

}, {
    timestamps: true
})

export default mongoose.model('teacherModel', teacherSchema);