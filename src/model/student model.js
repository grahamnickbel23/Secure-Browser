import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({

    enrollmentId:{
        type: Number,
        unique: true,
        required: true
    },

    name:{
        type: String,
        required: true
    },

    email:{
        type: String,
        unique: true,
        required: true
    },

    password: {
        type: String,
        required: true
    },
    
    department:{
        type: String,
        required: true
    },

    section: {
        type: String,
        required: true
    },

    roll :{
        type: Number,
        required: true
    },

    secure:{
        type: Boolean,
        default: true
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

export default mongoose.model('studnetModel', studentSchema);