const mongoose = require("mongoose");

const sharedGoalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Shared goal title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    thrustArea: {
      type: String,
      trim: true,
    },
    uomType: {
      type: String,
      enum: ["min", "max", "zero", "timeline"],
    },
    target: {
      type: Number,
    },
    deadline: {
      type: Date,
    },
    department: {
      type: String,
      trim: true,
    },
    cycleYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    linkedGoalIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Goal",
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model("SharedGoal", sharedGoalSchema);
