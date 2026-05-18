const express = require("express");
const Goal = require("../models/Goal");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleGuard");
const { createLog } = require("../services/auditService");
const { calcScore } = require("../services/scoreService");
const CheckIn = require("../models/CheckIn");

const router = express.Router();

/* ═══════════════════════════════════════════════════════════════════════════
   EMPLOYEE ENDPOINTS
   ═══════════════════════════════════════════════════════════════════════════ */

// ── GET /api/goals/my ────────────────────────────────────────────────────
router.get("/my", verifyToken, async (req, res) => {
  try {
    const goals = await Goal.find({
      employeeId: req.user.id,
      cycleYear: new Date().getFullYear(),
    })
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({ goals });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── POST /api/goals ──────────────────────────────────────────────────────
router.post("/", verifyToken, async (req, res) => {
  try {
    const { thrustArea, title, description, uomType, target, weightage, deadline, aiImproved } = req.body;

    if (!title) return res.status(400).json({ message: "Goal title is required" });
    if (weightage < 10) return res.status(400).json({ message: "Weightage must be at least 10%" });

    const cycleYear = new Date().getFullYear();
    const existingCount = await Goal.countDocuments({ employeeId: req.user.id, cycleYear });
    if (existingCount >= 8) return res.status(400).json({ message: "Maximum 8 goals allowed per cycle" });

    const existing = await Goal.find({ employeeId: req.user.id, cycleYear });
    const currentTotal = existing.reduce((sum, g) => sum + (g.weightage || 0), 0);

    if (currentTotal + weightage > 100) {
      return res.status(400).json({
        message: `Total weightage would be ${currentTotal + weightage}%. Maximum is 100%. Remaining: ${100 - currentTotal}%`,
      });
    }

    const goal = await Goal.create({
      employeeId: req.user.id,
      cycleYear,
      thrustArea, title, description, uomType,
      target: uomType === "timeline" ? null : target,
      weightage,
      deadline: deadline ? new Date(deadline) : null,
      status: "draft",
      aiImproved: !!aiImproved,
    });

    await createLog({ entityId: goal._id, entityType: "goal", action: "goal_created", performedBy: req.user.id, newValue: { title, weightage } });

    return res.status(201).json({ goal });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── PUT /api/goals/:id ──────────────────────────────────────────────────
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    if (goal.employeeId.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    if (goal.status !== "draft") return res.status(400).json({ message: "Only draft goals can be edited" });

    const { thrustArea, title, description, uomType, target, weightage, deadline } = req.body;

    if (weightage !== undefined && weightage < 10)
      return res.status(400).json({ message: "Weightage must be at least 10%" });

    if (weightage !== undefined) {
      const others = await Goal.find({ employeeId: req.user.id, cycleYear: goal.cycleYear, _id: { $ne: goal._id } });
      const othersTotal = others.reduce((sum, g) => sum + (g.weightage || 0), 0);
      if (othersTotal + weightage > 100)
        return res.status(400).json({ message: `Total weightage would be ${othersTotal + weightage}%. Maximum is 100%.` });
    }

    const oldValue = { title: goal.title, target: goal.target, weightage: goal.weightage };

    if (thrustArea !== undefined) goal.thrustArea = thrustArea;
    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (uomType !== undefined) goal.uomType = uomType;
    if (target !== undefined) goal.target = uomType === "timeline" ? null : target;
    if (weightage !== undefined) goal.weightage = weightage;
    if (deadline !== undefined) goal.deadline = deadline ? new Date(deadline) : null;

    await goal.save();
    await createLog({ entityId: goal._id, entityType: "goal", action: "goal_updated", performedBy: req.user.id, oldValue, newValue: { title: goal.title, target: goal.target, weightage: goal.weightage } });

    return res.json({ goal });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── DELETE /api/goals/:id ───────────────────────────────────────────────
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    if (goal.employeeId.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    if (goal.status !== "draft") return res.status(400).json({ message: "Only draft goals can be deleted" });

    await createLog({ entityId: goal._id, entityType: "goal", action: "goal_deleted", performedBy: req.user.id, oldValue: { title: goal.title } });
    await Goal.findByIdAndDelete(req.params.id);

    return res.json({ message: "Goal deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── POST /api/goals/:id/submit ──────────────────────────────────────────
router.post("/:id/submit", verifyToken, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    if (goal.employeeId.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    if (goal.status !== "draft") return res.status(400).json({ message: "Only draft goals can be submitted" });

    const allGoals = await Goal.find({ employeeId: req.user.id, cycleYear: goal.cycleYear });
    const totalWeightage = allGoals.reduce((sum, g) => sum + (g.weightage || 0), 0);
    if (totalWeightage !== 100) return res.status(400).json({ message: `Total weightage must equal 100%. Current: ${totalWeightage}%` });

    goal.status = "submitted";
    await goal.save();
    await createLog({ entityId: goal._id, entityType: "goal", action: "goal_submitted", performedBy: req.user.id });

    return res.json({ goal });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── POST /api/goals/submit-all ──────────────────────────────────────────
router.post("/submit-all", verifyToken, async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear();
    const allGoals = await Goal.find({ employeeId: req.user.id, cycleYear });
    const totalWeightage = allGoals.reduce((sum, g) => sum + (g.weightage || 0), 0);
    if (totalWeightage !== 100) return res.status(400).json({ message: `Total weightage must equal 100%. Current: ${totalWeightage}%` });

    const drafts = allGoals.filter((g) => g.status === "draft");
    if (drafts.length === 0) return res.status(400).json({ message: "No draft goals to submit" });

    await Goal.updateMany({ _id: { $in: drafts.map((g) => g._id) } }, { $set: { status: "submitted" } });

    for (const d of drafts) {
      await createLog({ entityId: d._id, entityType: "goal", action: "goal_submitted", performedBy: req.user.id });
    }

    const updated = await Goal.find({ employeeId: req.user.id, cycleYear }).populate("approvedBy", "name email").sort({ createdAt: -1 });
    return res.json({ goals: updated, submitted: drafts.length });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   MANAGER ENDPOINTS
   ═══════════════════════════════════════════════════════════════════════════ */

// ── GET /api/goals/team — all goals of direct reports ───────────────────
router.get("/team", verifyToken, requireRole("manager", "admin"), async (req, res) => {
  try {
    // Find all users managed by this manager
    const reports = await User.find({ managerId: req.user.id, isActive: true }).select("_id name email department role");

    const reportIds = reports.map((r) => r._id);
    const cycleYear = new Date().getFullYear();

    const goals = await Goal.find({ employeeId: { $in: reportIds }, cycleYear })
      .populate("employeeId", "name email department")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    // Group by employee
    const grouped = {};
    for (const r of reports) {
      grouped[r._id.toString()] = {
        employee: r,
        goals: [],
        pendingCount: 0,
        totalWeightage: 0,
      };
    }

    for (const g of goals) {
      const empId = g.employeeId._id.toString();
      if (!grouped[empId]) continue;
      grouped[empId].goals.push(g);
      grouped[empId].totalWeightage += g.weightage || 0;
      if (g.status === "submitted") grouped[empId].pendingCount++;
    }

    const pendingApprovals = goals.filter((g) => g.status === "submitted").length;

    return res.json({
      team: Object.values(grouped),
      pendingApprovals,
      totalGoals: goals.length,
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── PUT /api/goals/:id/inline-edit (manager only) ───────────────────────
router.put("/:id/inline-edit", verifyToken, requireRole("manager", "admin"), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id).populate("employeeId", "managerId");
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    // Check this manager owns the employee
    if (goal.employeeId.managerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized — not this employee's manager" });
    }

    if (goal.status !== "submitted") {
      return res.status(400).json({ message: "Only submitted goals can be inline-edited" });
    }

    const { target, weightage } = req.body;
    const oldValue = { target: goal.target, weightage: goal.weightage };

    // Validate weightage total if changing weightage
    if (weightage !== undefined) {
      if (weightage < 10) return res.status(400).json({ message: "Weightage must be at least 10%" });

      const otherGoals = await Goal.find({
        employeeId: goal.employeeId._id,
        cycleYear: goal.cycleYear,
        _id: { $ne: goal._id },
      });
      const othersTotal = otherGoals.reduce((s, g) => s + (g.weightage || 0), 0);

      if (othersTotal + weightage !== 100) {
        return res.status(400).json({
          message: `Total weightage must remain 100%. With this change it would be ${othersTotal + weightage}%.`,
        });
      }

      goal.weightage = weightage;
    }

    if (target !== undefined) goal.target = target;

    await goal.save();

    await createLog({
      entityId: goal._id,
      entityType: "goal",
      action: "inline_edit",
      performedBy: req.user.id,
      oldValue,
      newValue: { target: goal.target, weightage: goal.weightage },
    });

    const updated = await Goal.findById(goal._id).populate("employeeId", "name email department").populate("approvedBy", "name email");
    return res.json({ goal: updated });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── PUT /api/goals/:id/approve ──────────────────────────────────────────
router.put("/:id/approve", verifyToken, requireRole("manager", "admin"), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id).populate("employeeId", "managerId name");
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    if (goal.employeeId.managerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (goal.status !== "submitted") {
      return res.status(400).json({ message: "Only submitted goals can be approved" });
    }

    goal.status = "approved";
    goal.isLocked = true;
    goal.approvedAt = new Date();
    goal.approvedBy = req.user.id;
    await goal.save();

    await createLog({
      entityId: goal._id,
      entityType: "goal",
      action: "approved",
      performedBy: req.user.id,
      newValue: { title: goal.title, status: "approved" },
    });

    const updated = await Goal.findById(goal._id).populate("employeeId", "name email department").populate("approvedBy", "name email");
    return res.json({ goal: updated });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── PUT /api/goals/:id/reject ───────────────────────────────────────────
router.put("/:id/reject", verifyToken, requireRole("manager", "admin"), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id).populate("employeeId", "managerId name");
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    if (goal.employeeId.managerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (goal.status !== "submitted") {
      return res.status(400).json({ message: "Only submitted goals can be rejected" });
    }

    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Rejection comment is required" });
    }

    goal.status = "rejected";
    goal.managerComment = comment.trim();
    await goal.save();

    await createLog({
      entityId: goal._id,
      entityType: "goal",
      action: "rejected",
      performedBy: req.user.id,
      newValue: { title: goal.title, status: "rejected", comment: goal.managerComment },
    });

    const updated = await Goal.findById(goal._id).populate("employeeId", "name email department").populate("approvedBy", "name email");
    return res.json({ goal: updated });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── POST /api/goals/approve-all/:employeeId ─────────────────────────────
router.post("/approve-all/:employeeId", verifyToken, requireRole("manager", "admin"), async (req, res) => {
  try {
    const employee = await User.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    if (employee.managerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const cycleYear = new Date().getFullYear();
    const submitted = await Goal.find({
      employeeId: req.params.employeeId,
      cycleYear,
      status: "submitted",
    });

    if (submitted.length === 0) {
      return res.status(400).json({ message: "No submitted goals to approve" });
    }

    const now = new Date();
    await Goal.updateMany(
      { _id: { $in: submitted.map((g) => g._id) } },
      { $set: { status: "approved", isLocked: true, approvedAt: now, approvedBy: req.user.id } }
    );

    for (const g of submitted) {
      await createLog({
        entityId: g._id,
        entityType: "goal",
        action: "approved",
        performedBy: req.user.id,
        newValue: { title: g.title, status: "approved", bulk: true },
      });
    }

    return res.json({ message: `Approved ${submitted.length} goal(s)`, approved: submitted.length });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   CHECK-IN / ACHIEVEMENT ENDPOINTS
   ═══════════════════════════════════════════════════════════════════════════ */

// ── POST /api/goals/:id/checkin — employee logs achievement ─────────────
router.post("/:id/checkin", verifyToken, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    if (goal.employeeId.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    if (goal.status !== "approved" || !goal.isLocked) {
      return res.status(400).json({ message: "Check-ins are only allowed for approved & locked goals" });
    }

    const { quarter, actual, status } = req.body;
    if (!quarter || !["Q1", "Q2", "Q3", "Q4"].includes(quarter)) {
      return res.status(400).json({ message: "Valid quarter (Q1-Q4) is required" });
    }
    if (actual === undefined || actual === null) {
      return res.status(400).json({ message: "Actual value is required" });
    }

    const score = calcScore(goal.uomType, goal.target, actual);

    // Push or update achievement for this quarter
    const existingIdx = goal.achievements.findIndex((a) => a.quarter === quarter);
    const achievementData = {
      quarter,
      actual: Number(actual),
      status: status || "on_track",
      score,
      updatedAt: new Date(),
    };

    const oldValue = existingIdx >= 0 ? { ...goal.achievements[existingIdx].toObject() } : null;

    if (existingIdx >= 0) {
      goal.achievements[existingIdx] = achievementData;
    } else {
      goal.achievements.push(achievementData);
    }

    await goal.save();

    await createLog({
      entityId: goal._id,
      entityType: "goal",
      action: "achievement_updated",
      performedBy: req.user.id,
      oldValue,
      newValue: { ...achievementData, score },
    });

    return res.json({ goal, score });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── GET /api/goals/:id/checkins — get check-in history ──────────────────
router.get("/:id/checkins", verifyToken, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const checkIns = await CheckIn.find({ goalId: req.params.id })
      .populate("managerId", "name email")
      .sort({ conductedAt: -1 });

    return res.json({
      achievements: goal.achievements || [],
      checkIns,
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── GET /api/goals/:id/audit — audit trail for a single goal ────────────
router.get("/:id/audit", verifyToken, async (req, res) => {
  try {
    const AuditLog = require("../models/AuditLog");
    const logs = await AuditLog.find({ entityId: req.params.id, entityType: "goal" })
      .populate("performedBy", "name role")
      .sort({ timestamp: -1 })
      .limit(10);
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
