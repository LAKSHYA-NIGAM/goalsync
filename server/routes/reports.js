const express = require("express");
const Goal = require("../models/Goal");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleGuard");
const { calcScore } = require("../services/scoreService");

const router = express.Router();

// ── GET /api/reports/achievement ─────────────────────────────────────────
router.get("/achievement", verifyToken, requireRole("admin", "manager"), async (req, res) => {
  try {
    const { quarter, department, cycleYear } = req.query;
    const year = Number(cycleYear) || new Date().getFullYear();

    const goalFilter = { cycleYear: year, status: "approved" };
    const goals = await Goal.find(goalFilter).populate("employeeId", "name email department");

    const rows = [];
    for (const g of goals) {
      if (department && g.employeeId?.department !== department) continue;
      if (!g.achievements || g.achievements.length === 0) {
        if (!quarter) {
          rows.push({
            employeeName: g.employeeId?.name || "Unknown",
            department: g.employeeId?.department || "—",
            goalTitle: g.title,
            thrustArea: g.thrustArea || "—",
            uomType: g.uomType,
            target: g.target,
            actual: null,
            score: 0,
            status: "not_started",
            quarter: "—",
          });
        }
        continue;
      }

      for (const a of g.achievements) {
        if (quarter && a.quarter !== quarter) continue;
        const score = calcScore(g.uomType, g.target, a.actual);
        rows.push({
          employeeName: g.employeeId?.name || "Unknown",
          department: g.employeeId?.department || "—",
          goalTitle: g.title,
          thrustArea: g.thrustArea || "—",
          uomType: g.uomType,
          target: g.target,
          actual: a.actual,
          score,
          status: a.status || "not_started",
          quarter: a.quarter,
        });
      }
    }

    return res.json({ rows, totalCount: rows.length });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── GET /api/reports/completion ──────────────────────────────────────────
router.get("/completion", verifyToken, requireRole("admin", "manager"), async (req, res) => {
  try {
    const year = Number(req.query.cycleYear) || new Date().getFullYear();
    const employees = await User.find({ role: "employee", isActive: true }).populate("managerId", "name");
    const goals = await Goal.find({ cycleYear: year }).populate("employeeId", "name department");

    const empMap = {};
    for (const e of employees) {
      empMap[e._id.toString()] = {
        employeeName: e.name,
        department: e.department || "—",
        manager: e.managerId?.name || "—",
        totalGoals: 0,
        approvedGoals: 0,
        checkInsCompleted: 0,
        totalScore: 0,
        scoreCount: 0,
      };
    }

    for (const g of goals) {
      const eid = g.employeeId?._id?.toString();
      if (!eid || !empMap[eid]) continue;
      empMap[eid].totalGoals++;
      if (g.status === "approved") {
        empMap[eid].approvedGoals++;
        if (g.achievements) {
          empMap[eid].checkInsCompleted += g.achievements.length;
          for (const a of g.achievements) {
            empMap[eid].totalScore += calcScore(g.uomType, g.target, a.actual);
            empMap[eid].scoreCount++;
          }
        }
      }
    }

    const rows = Object.values(empMap).map(e => ({
      ...e,
      overallScore: e.scoreCount > 0 ? Math.round(e.totalScore / e.scoreCount) : 0,
    }));

    return res.json({ rows, totalCount: rows.length });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── GET /api/reports/export-csv ──────────────────────────────────────────
router.get("/export-csv", verifyToken, requireRole("admin", "manager"), async (req, res) => {
  try {
    const { type, quarter, department, cycleYear } = req.query;
    let rows;

    if (type === "completion") {
      // Reuse completion logic inline
      const year = Number(cycleYear) || new Date().getFullYear();
      const employees = await User.find({ role: "employee", isActive: true }).populate("managerId", "name");
      const goals = await Goal.find({ cycleYear: year }).populate("employeeId", "name department");

      const empMap = {};
      for (const e of employees) {
        empMap[e._id.toString()] = { Employee: e.name, Department: e.department || "", Manager: e.managerId?.name || "", "Total Goals": 0, "Approved Goals": 0, "Check-ins Done": 0, "Avg Score": 0, _scores: [] };
      }
      for (const g of goals) {
        const eid = g.employeeId?._id?.toString();
        if (!eid || !empMap[eid]) continue;
        empMap[eid]["Total Goals"]++;
        if (g.status === "approved") {
          empMap[eid]["Approved Goals"]++;
          if (g.achievements) {
            empMap[eid]["Check-ins Done"] += g.achievements.length;
            for (const a of g.achievements) empMap[eid]._scores.push(calcScore(g.uomType, g.target, a.actual));
          }
        }
      }
      rows = Object.values(empMap).map(e => {
        const { _scores, ...rest } = e;
        rest["Avg Score"] = _scores.length > 0 ? Math.round(_scores.reduce((s, v) => s + v, 0) / _scores.length) : 0;
        return rest;
      });
    } else {
      // Achievement report
      const year = Number(cycleYear) || new Date().getFullYear();
      const goals = await Goal.find({ cycleYear: year, status: "approved" }).populate("employeeId", "name department");
      rows = [];
      for (const g of goals) {
        if (department && g.employeeId?.department !== department) continue;
        if (!g.achievements?.length) continue;
        for (const a of g.achievements) {
          if (quarter && a.quarter !== quarter) continue;
          rows.push({
            Employee: g.employeeId?.name || "Unknown",
            Department: g.employeeId?.department || "",
            "Goal Title": g.title,
            "Thrust Area": g.thrustArea || "",
            UoM: g.uomType,
            Target: g.target,
            Actual: a.actual,
            Score: calcScore(g.uomType, g.target, a.actual),
            Status: a.status || "not_started",
            Quarter: a.quarter,
          });
        }
      }
    }

    if (rows.length === 0) {
      return res.status(200).send("No data to export");
    }

    // Build CSV manually (no dependency needed)
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map(r => headers.map(h => {
        const val = r[h] ?? "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(",")),
    ];
    const csv = csvLines.join("\n");

    const filename = `goalsync_${type || "achievement"}_report${quarter ? `_${quarter}` : ""}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ message: "Export failed" });
  }
});

module.exports = router;
