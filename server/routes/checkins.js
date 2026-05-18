const express = require("express");
const CheckIn = require("../models/CheckIn");
const Goal = require("../models/Goal");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleGuard");
const { createLog } = require("../services/auditService");

const router = express.Router();

// ── POST /api/checkins/manager-comment ───────────────────────────────────
router.post("/manager-comment", verifyToken, requireRole("manager", "admin"), async (req, res) => {
  try {
    const { goalId, quarter, comment } = req.body;

    if (!goalId || !quarter || !comment?.trim()) {
      return res.status(400).json({ message: "goalId, quarter, and comment are required" });
    }

    const goal = await Goal.findById(goalId).populate("employeeId", "managerId name");
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    if (goal.employeeId.managerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Upsert: update existing check-in or create new
    let checkIn = await CheckIn.findOne({ goalId, quarter, managerId: req.user.id });

    if (checkIn) {
      checkIn.comment = comment.trim();
      checkIn.conductedAt = new Date();
      await checkIn.save();
    } else {
      checkIn = await CheckIn.create({
        goalId,
        employeeId: goal.employeeId._id,
        managerId: req.user.id,
        quarter,
        plannedTarget: goal.target,
        actualAchievement: null,
        comment: comment.trim(),
        conductedAt: new Date(),
      });
    }

    await createLog({
      entityId: goal._id,
      entityType: "goal",
      action: "checkin_comment",
      performedBy: req.user.id,
      newValue: { quarter, comment: comment.trim() },
    });

    return res.json({ checkIn });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── GET /api/checkins/team/:quarter ──────────────────────────────────────
router.get("/team/:quarter", verifyToken, requireRole("manager", "admin"), async (req, res) => {
  try {
    const { quarter } = req.params;
    if (!["Q1", "Q2", "Q3", "Q4"].includes(quarter)) {
      return res.status(400).json({ message: "Invalid quarter" });
    }

    const reports = await User.find({ managerId: req.user.id, isActive: true }).select("_id");
    const reportIds = reports.map((r) => r._id);
    const cycleYear = new Date().getFullYear();

    // Get all approved goals for these employees
    const goals = await Goal.find({
      employeeId: { $in: reportIds },
      cycleYear,
      status: "approved",
      isLocked: true,
    })
      .populate("employeeId", "name email department")
      .sort({ "employeeId.name": 1 });

    // Get check-in comments for this quarter
    const checkIns = await CheckIn.find({
      goalId: { $in: goals.map((g) => g._id) },
      quarter,
    });

    const checkInMap = {};
    for (const ci of checkIns) {
      checkInMap[ci.goalId.toString()] = ci;
    }

    // Build response
    const results = goals.map((goal) => {
      const achievement = goal.achievements?.find((a) => a.quarter === quarter);
      const ci = checkInMap[goal._id.toString()];

      return {
        _id: goal._id,
        title: goal.title,
        thrustArea: goal.thrustArea,
        uomType: goal.uomType,
        target: goal.target,
        deadline: goal.deadline,
        weightage: goal.weightage,
        employee: goal.employeeId,
        achievement: achievement || null,
        managerComment: ci?.comment || null,
        checkInId: ci?._id || null,
        conductedAt: ci?.conductedAt || null,
      };
    });

    return res.json({ results, quarter });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
