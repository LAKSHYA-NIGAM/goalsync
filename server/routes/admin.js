const express = require("express");
const User = require("../models/User");
const Goal = require("../models/Goal");
const AuditLog = require("../models/AuditLog");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleGuard");
const { createLog } = require("../services/auditService");
const { calcScore } = require("../services/scoreService");
const bcrypt = require("bcryptjs");

const router = express.Router();

let dashCache = null;
let dashCacheTime = 0;

// ── GET /api/admin/dashboard-stats ──────────────────────────────────────
router.get("/dashboard-stats", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    if (dashCache && Date.now() - dashCacheTime < 60000) {
      return res.json(dashCache);
    }

    const cycleYear = new Date().getFullYear();

    const [users, goals] = await Promise.all([
      User.find({ isActive: true }),
      Goal.find({ cycleYear }).populate("employeeId", "name email department"),
    ]);

    const totalEmployees = users.filter(u => u.role === "employee").length;
    const totalGoals = goals.length;
    const approvedGoals = goals.filter(g => g.status === "approved").length;
    const pendingApprovals = goals.filter(g => g.status === "submitted").length;

    // Overall completion: approved goals with at least one achievement
    const goalsWithAchievement = goals.filter(
      g => g.status === "approved" && g.achievements && g.achievements.length > 0
    ).length;
    const overallCompletionPct = approvedGoals > 0
      ? Math.round((goalsWithAchievement / approvedGoals) * 100)
      : 0;

    // Goals by status
    const goalsByStatus = {
      draft: goals.filter(g => g.status === "draft").length,
      submitted: pendingApprovals,
      approved: approvedGoals,
      rejected: goals.filter(g => g.status === "rejected").length,
    };

    // Department breakdown
    const deptMap = {};
    for (const g of goals) {
      const dept = g.employeeId?.department || "Unknown";
      if (!deptMap[dept]) deptMap[dept] = { dept, totalGoals: 0, completedGoals: 0 };
      deptMap[dept].totalGoals++;
      if (g.status === "approved" && g.achievements?.length > 0) {
        deptMap[dept].completedGoals++;
      }
    }
    const departmentBreakdown = Object.values(deptMap).map(d => ({
      ...d,
      completionPct: d.totalGoals > 0 ? Math.round((d.completedGoals / d.totalGoals) * 100) : 0,
    }));

    // Quarterly progress — avg score per quarter
    const quarterScores = { Q1: [], Q2: [], Q3: [], Q4: [] };
    for (const g of goals) {
      if (g.status !== "approved" || !g.achievements) continue;
      for (const a of g.achievements) {
        const score = calcScore(g.uomType, g.target, a.actual);
        if (quarterScores[a.quarter]) quarterScores[a.quarter].push(score);
      }
    }
    const quarterlyProgress = ["Q1", "Q2", "Q3", "Q4"].map(q => ({
      quarter: q,
      avgScore: quarterScores[q].length > 0
        ? Math.round(quarterScores[q].reduce((s, v) => s + v, 0) / quarterScores[q].length)
        : 0,
    }));

    // Top performers — avg score across all achievements
    const empScores = {};
    for (const g of goals) {
      if (g.status !== "approved" || !g.achievements?.length) continue;
      const empId = g.employeeId?._id?.toString();
      if (!empId) continue;
      if (!empScores[empId]) {
        empScores[empId] = { name: g.employeeId.name, department: g.employeeId.department, scores: [] };
      }
      for (const a of g.achievements) {
        empScores[empId].scores.push(calcScore(g.uomType, g.target, a.actual));
      }
    }
    const topPerformers = Object.entries(empScores)
      .map(([id, data]) => ({
        employeeId: id,
        name: data.name,
        department: data.department,
        avgScore: Math.round(data.scores.reduce((s, v) => s + v, 0) / data.scores.length),
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    // Pending check-ins — approved goals without current quarter achievement
    const currentMonth = new Date().getMonth();
    const currentQ = currentMonth < 3 ? "Q1" : currentMonth < 6 ? "Q2" : currentMonth < 9 ? "Q3" : "Q4";
    const pendingCheckIns = goals
      .filter(g => g.status === "approved" && !g.achievements?.find(a => a.quarter === currentQ))
      .slice(0, 10)
      .map(g => ({
        employeeId: g.employeeId?._id,
        name: g.employeeId?.name,
        department: g.employeeId?.department,
        quarter: currentQ,
        goalTitle: g.title,
      }));

    const result = {
      totalEmployees, totalGoals, approvedGoals, pendingApprovals,
      overallCompletionPct, departmentBreakdown, quarterlyProgress,
      goalsByStatus, topPerformers, pendingCheckIns,
    };
    dashCache = result;
    dashCacheTime = Date.now();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── GET /api/admin/users ────────────────────────────────────────────────
router.get("/users", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear();
    const users = await User.find().populate("managerId", "name email").sort({ name: 1 });
    const goals = await Goal.find({ cycleYear });

    const goalCountMap = {};
    for (const g of goals) {
      const eid = g.employeeId.toString();
      goalCountMap[eid] = (goalCountMap[eid] || 0) + 1;
    }

    const result = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      manager: u.managerId ? { _id: u.managerId._id, name: u.managerId.name } : null,
      goalCount: goalCountMap[u._id.toString()] || 0,
      isActive: u.isActive,
    }));

    return res.json({ users: result });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── POST /api/admin/users ───────────────────────────────────────────────
router.post("/users", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password, role, department, managerId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, passwordHash,
      role: role || "employee",
      department: department || "",
      managerId: managerId || null,
    });

    await createLog({ entityId: user._id, entityType: "user", action: "user_created", performedBy: req.user.id, newValue: { name, email, role: role || "employee", department } });

    return res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── PUT /api/admin/users/:id ────────────────────────────────────────────
router.put("/users/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, role, department, managerId, isActive } = req.body;
    const oldValue = { name: user.name, role: user.role, department: user.department };
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (department !== undefined) user.department = department;
    if (managerId !== undefined) user.managerId = managerId || null;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    await createLog({ entityId: user._id, entityType: "user", action: "user_updated", performedBy: req.user.id, oldValue, newValue: { name: user.name, role: user.role, department: user.department } });
    return res.json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── PUT /api/admin/goals/:id/unlock ─────────────────────────────────────
router.put("/goals/:id/unlock", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    goal.isLocked = false;
    await goal.save();

    await createLog({
      entityId: goal._id,
      entityType: "goal",
      action: "admin_unlock",
      performedBy: req.user.id,
      newValue: { title: goal.title, isLocked: false },
    });

    return res.json({ message: "Goal unlocked", goal });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── GET /api/admin/audit-logs ────────────────────────────────────────────
router.get("/audit-logs", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { entityType, action, performedBy, fromDate, toDate, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (action) filter.action = action;
    if (performedBy) filter.performedBy = performedBy;
    if (fromDate || toDate) {
      filter.timestamp = {};
      if (fromDate) filter.timestamp.$gte = new Date(fromDate);
      if (toDate) filter.timestamp.$lte = new Date(toDate + "T23:59:59.999Z");
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, totalCount] = await Promise.all([
      AuditLog.find(filter)
        .populate("performedBy", "name email role")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({ logs, totalCount, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
