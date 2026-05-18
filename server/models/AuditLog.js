const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["goal", "user", "cycle"],
      required: [true, "Entity type is required"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Entity ID is required"],
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Performed-by user is required"],
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ entityId: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
