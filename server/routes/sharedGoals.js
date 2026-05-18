const express = require("express");
const SharedGoal = require("../models/SharedGoal");
const Goal = require("../models/Goal");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleGuard");
const { createLog } = require("../services/auditService");
const { calcScore } = require("../services/scoreService");

const router = express.Router();

// ── POST /api/shared-goals — create shared goal ────────────────────────
router.post("/", verifyToken, requireRole("manager", "admin"), async (req, res) => {
  try {
    const { title, description, thrustArea, uomType, target, deadline, department, weightage } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const shared = await SharedGoal.create({
      title,
      description,
      thrustArea,
      uomType,
      target: uomType === "timeline" ? null : target,
      deadline: deadline ? new Date(deadline) : null,
      department,
      cycleYear: new Date().getFullYear(),
      createdBy: req.user.id,
      linkedGoalIds: [],
    });

    await createLog({
      entityId: shared._id,
      entityType: "goal",
      action: "shared_goal_created",
      performedBy: req.user.id,
      newValue: { title, department },
    });

    return res.status(201).json({ sharedGoal: shared });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── POST /api/shared-goals/:id/assign — assign to employees ────────────
router.post("/:id/assign", verifyToken, requireRole("manager", "admin"), async (req, res) => {
  try {
    const shared = await SharedGoal.findById(req.params.id);
    if (!shared) return res.status(404).json({ message: "Shared goal not found" });

    const { employeeIds, weightage = 20 } = req.body;
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ message: "At least one employee ID is required" });
    }

    const cycleYear = new Date().getFullYear();
    const created = [];

    for (const empId of employeeIds) {
      // Check employee exists
      const emp = await User.findById(empId);
      if (!emp) continue;

      // Check if already assigned
      const existing = await Goal.findOne({
        employeeId: empId,
        sharedGoalId: shared._id,
        cycleYear,
      });
      if (existing) continue;

      // Check weightage budget
      const empGoals = await Goal.find({ employeeId: empId, cycleYear });
      const currentTotal = empGoals.reduce((s, g) => s + (g.weightage || 0), 0);

      const effectiveWeight = Math.min(weightage, 100 - currentTotal);
      if (effectiveWeight < 10) continue; // skip if no room

      // Check max 8 goals
      if (empGoals.length >= 8) continue;

      const goal = await Goal.create({
        employeeId: empId,
        cycleYear,
        thrustArea: shared.thrustArea,
        title: shared.title,
        description: shared.description,
        uomType: shared.uomType,
        target: shared.target,
        deadline: shared.deadline,
        weightage: effectiveWeight,
        status: "approved",
        isLocked: true,
        isShared: true,
        sharedGoalId: shared._id,
        approvedAt: new Date(),
        approvedBy: req.user.id,
      });

      shared.linkedGoalIds.push(goal._id);
      created.push(goal);

      await createLog({
        entityId: goal._id,
        entityType: "goal",
        action: "shared_goal_assigned",
        performedBy: req.user.id,
        newValue: { title: shared.title, employeeId: empId, weightage: effectiveWeight },
      });
    }

    await shared.save();

    return res.json({
      message: `Assigned to ${created.length} employee(s)`,
      created: created.length,
      sharedGoal: shared,
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── PUT /api/shared-goals/:id/sync-achievement ──────────────────────────
router.put("/:id/sync-achievement", verifyToken, async (req, res) => {
  try {
    const shared = await SharedGoal.findById(req.params.id).populate("linkedGoalIds");
    if (!shared) return res.status(404).json({ message: "Shared goal not found" });

    const { quarter, actual, status } = req.body;
    if (!quarter || !["Q1", "Q2", "Q3", "Q4"].includes(quarter)) {
      return res.status(400).json({ message: "Valid quarter required" });
    }

    let synced = 0;

    for (const goalId of shared.linkedGoalIds) {
      const goal = await Goal.findById(goalId);
      if (!goal || !goal.isShared) continue;

      const achievementData = {
        quarter,
        actual: Number(actual),
        status: status || "on_track",
        updatedAt: new Date(),
      };

      const idx = goal.achievements.findIndex((a) => a.quarter === quarter);
      const oldVal = idx >= 0 ? { ...goal.achievements[idx].toObject() } : null;

      if (idx >= 0) {
        goal.achievements[idx] = achievementData;
      } else {
        goal.achievements.push(achievementData);
      }

      await goal.save();
      synced++;

      await createLog({
        entityId: goal._id,
        entityType: "goal",
        action: "shared_achievement_synced",
        performedBy: req.user.id,
        oldValue: oldVal,
        newValue: { ...achievementData, syncedFrom: shared._id },
      });
    }

    return res.json({ message: `Synced to ${synced} linked goal(s)`, synced });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── GET /api/shared-goals — list all ────────────────────────────────────
router.get("/", verifyToken, requireRole("manager", "admin"), async (req, res) => {
  try {
    const filter = { cycleYear: new Date().getFullYear() };
    if (req.query.department) filter.department = req.query.department;

    const sharedGoals = await SharedGoal.find(filter)
      .populate("createdBy", "name email")
      .populate({
        path: "linkedGoalIds",
        populate: { path: "employeeId", select: "name email department" },
      })
      .sort({ createdAt: -1 });

    return res.json({ sharedGoals });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── GET /api/shared-goals/my — employee's shared goals ──────────────────
router.get("/my", verifyToken, async (req, res) => {
  try {
    const goals = await Goal.find({
      employeeId: req.user.id,
      isShared: true,
      cycleYear: new Date().getFullYear(),
    })
      .populate("sharedGoalId")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({ goals });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── DELETE /api/shared-goals/:id — admin only ───────────────────────────
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const shared = await SharedGoal.findById(req.params.id);
    if (!shared) return res.status(404).json({ message: "Shared goal not found" });

    // Delete all linked goals
    if (shared.linkedGoalIds.length > 0) {
      await Goal.deleteMany({ _id: { $in: shared.linkedGoalIds } });
    }

    await createLog({
      entityId: shared._id,
      entityType: "goal",
      action: "shared_goal_deleted",
      performedBy: req.user.id,
      oldValue: { title: shared.title, linkedCount: shared.linkedGoalIds.length },
    });

    await SharedGoal.findByIdAndDelete(req.params.id);

    return res.json({ message: "Shared goal and all linked goals deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
