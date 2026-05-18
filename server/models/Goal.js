const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    quarter: {
      type: String,
      enum: ["Q1", "Q2", "Q3", "Q4"],
      required: true,
    },
    actual: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["not_started", "on_track", "completed"],
      default: "not_started",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const goalSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee ID is required"],
    },
    cycleYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    thrustArea: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
    },
    description: {
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
    weightage: {
      type: Number,
      min: [10, "Weightage must be at least 10"],
      max: [100, "Weightage must be at most 100"],
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedGoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SharedGoal",
      default: null,
    },
    managerComment: {
      type: String,
      trim: true,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    aiImproved: {
      type: Boolean,
      default: false,
    },
    achievements: [achievementSchema],
  },
  {
    timestamps: true,
  }
);

goalSchema.index({ employeeId: 1, cycleYear: 1 });
goalSchema.index({ status: 1 });

module.exports = mongoose.model("Goal", goalSchema);
