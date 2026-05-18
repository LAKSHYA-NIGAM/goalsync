const mongoose = require("mongoose");

const checkInSchema = new mongoose.Schema(
  {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: [true, "Goal ID is required"],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee ID is required"],
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    quarter: {
      type: String,
      enum: ["Q1", "Q2", "Q3", "Q4"],
      required: [true, "Quarter is required"],
    },
    plannedTarget: {
      type: Number,
    },
    actualAchievement: {
      type: Number,
    },
    comment: {
      type: String,
      trim: true,
    },
    conductedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("CheckIn", checkInSchema);
