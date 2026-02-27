import mongoose, { Schema } from "mongoose";

const examSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    url: {
        type: String,
        required: true
    },

    code: {
        type: Number,
        min: 100000,
        max: 999999,
        default: null
    },

    isActive: {
        type: Boolean,
        default: true
    },

    examTime: {
        type: Date,
        required: true
    },

    duration: {
        type: Number,
        required: true
    },

    creatorId: {
        type: Schema.Types.ObjectId,
        ref: "teacherModel",
        required: true
    },

    students: [{
        type: Schema.Types.ObjectId,
        ref: "studnetModel"
    }]

}, {
    timestamps: true
});

examSchema.index(
  { code: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
      code: { $type: "number" }
    }
  }
);

export default mongoose.model("examModel", examSchema);