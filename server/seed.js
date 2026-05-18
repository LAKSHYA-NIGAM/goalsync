const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");
const Goal = require("./models/Goal");
const SharedGoal = require("./models/SharedGoal");
const CheckIn = require("./models/CheckIn");
const AuditLog = require("./models/AuditLog");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/goalsync";
const PWD = "Demo@1234";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅  Connected to MongoDB");

    // ── Check if already seeded ──────────────────────────────────────────
    const existingAdmin = await User.findOne({ email: "riya@goalsync.com" });
    if (existingAdmin) {
      console.log("⏭️   Already seeded, skipping");
      console.log("    Password for ALL accounts: Demo@1234");
      process.exit(0);
    }

    const hash = await bcrypt.hash(PWD, 10);
    const cy = new Date().getFullYear();

    // ── Users ───────────────────────────────────────────────────────────
    const usersData = [
      { name: "Riya Singh",      email: "riya@goalsync.com",      passwordHash: hash, role: "admin",    department: "HR",       cycleYear: cy, isActive: true },
      { name: "Priya Sharma",    email: "priya@goalsync.com",     passwordHash: hash, role: "manager",  department: "Sales",    cycleYear: cy, isActive: true },
      { name: "Rohit Verma",     email: "rohit@goalsync.com",     passwordHash: hash, role: "manager",  department: "Product",  cycleYear: cy, isActive: true },
      { name: "Arjun Mehta",     email: "arjun@goalsync.com",     passwordHash: hash, role: "employee", department: "Sales",    cycleYear: cy, isActive: true },
      { name: "Kavya Reddy",     email: "kavya@goalsync.com",     passwordHash: hash, role: "employee", department: "Sales",    cycleYear: cy, isActive: true },
      { name: "Siddharth Nair",  email: "siddharth@goalsync.com", passwordHash: hash, role: "employee", department: "Sales",    cycleYear: cy, isActive: true },
      { name: "Ananya Gupta",    email: "ananya@goalsync.com",    passwordHash: hash, role: "employee", department: "Product",  cycleYear: cy, isActive: true },
      { name: "Rohan Das",       email: "rohan@goalsync.com",     passwordHash: hash, role: "employee", department: "Product",  cycleYear: cy, isActive: true },
      { name: "Meera Iyer",      email: "meera@goalsync.com",     passwordHash: hash, role: "employee", department: "Product",  cycleYear: cy, isActive: true },
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        createdUsers.push(await User.create(u));
      } else {
        createdUsers.push(exists);
      }
    }

    const [admin, mgrSales, mgrProduct, emp1, emp2, emp3, emp4, emp5, emp6] = createdUsers;

    // Link managers
    for (const e of [emp1, emp2, emp3]) { if (!e.managerId) { e.managerId = mgrSales._id; await e.save(); } }
    for (const e of [emp4, emp5, emp6]) { if (!e.managerId) { e.managerId = mgrProduct._id; await e.save(); } }

    console.log("👤  Created 9 users (1 admin, 2 managers, 6 employees)");

    // ── Goal templates per department ───────────────────────────────────
    const salesGoals = [
      { thrustArea: "Revenue Growth",      title: "Increase Quarterly Revenue",           uomType: "min",      target: 500000, weightage: 30, desc: "Achieve minimum quarterly revenue of ₹5,00,000 through client acquisition and upsells." },
      { thrustArea: "Customer Experience",  title: "Reduce Customer Response Time",        uomType: "max",      target: 24,     weightage: 20, desc: "Bring average customer response time down to 24 hours maximum." },
      { thrustArea: "Revenue Growth",      title: "Acquire 15 New Enterprise Clients",    uomType: "min",      target: 15,     weightage: 20, desc: "Close a minimum of 15 new enterprise deals with ACV ≥ ₹2L." },
      { thrustArea: "Compliance",          title: "Maintain 100% CRM Data Accuracy",      uomType: "min",      target: 100,    weightage: 15, desc: "All deals logged in CRM within 24h with accurate pipeline staging." },
      { thrustArea: "People",             title: "Complete Sales Certification Program",  uomType: "timeline", target: null,   weightage: 15, desc: "Finish advanced sales methodology certification by Q3.", deadline: "2025-09-30" },
    ];

    const productGoals = [
      { thrustArea: "Product",            title: "Ship 3 Major Feature Releases",         uomType: "min",      target: 3,      weightage: 30, desc: "Deliver 3 major features to production with zero P0 regressions." },
      { thrustArea: "Operations",         title: "Reduce Build Pipeline Time",            uomType: "max",      target: 15,     weightage: 20, desc: "Optimize CI/CD pipeline to under 15 minutes per build." },
      { thrustArea: "Customer Experience", title: "Achieve 95% Sprint Velocity",           uomType: "min",      target: 95,     weightage: 20, desc: "Maintain sprint velocity completion rate at or above 95%." },
      { thrustArea: "Compliance",         title: "Zero Critical Security Vulnerabilities", uomType: "zero",     target: 0,      weightage: 15, desc: "No P0/P1 security vulnerabilities in production code." },
      { thrustArea: "People",             title: "Mentor 2 Junior Engineers",              uomType: "min",      target: 2,      weightage: 15, desc: "Complete structured mentorship program for 2 junior team members." },
    ];

    // Q1/Q2 achievement data
    const salesQ1 = [
      [{ actual: 580000, status: "on_track" }, { actual: 18, status: "completed" }, { actual: 5, status: "on_track" },  { actual: 98, status: "on_track" },  null],
      [{ actual: 420000, status: "on_track" }, { actual: 28, status: "on_track" },  { actual: 3, status: "on_track" },  { actual: 100, status: "completed" }, null],
      [{ actual: 610000, status: "completed"}, { actual: 22, status: "on_track" },  { actual: 6, status: "on_track" },  { actual: 95, status: "on_track" },  null],
    ];
    const salesQ2 = [
      [{ actual: 520000, status: "on_track" }, { actual: 20, status: "on_track" }, null, null, null],
      [null, null, null, null, null],
      [{ actual: 490000, status: "on_track" }, null, { actual: 4, status: "on_track" }, null, null],
    ];

    const productQ1 = [
      [{ actual: 1, status: "on_track" },  { actual: 12, status: "completed" }, { actual: 97, status: "completed" }, { actual: 0, status: "completed" }, { actual: 1, status: "on_track" }],
      [{ actual: 1, status: "on_track" },  { actual: 18, status: "on_track" },  { actual: 88, status: "on_track" },  { actual: 0, status: "completed" }, { actual: 0, status: "not_started" }],
      [{ actual: 2, status: "on_track" },  { actual: 14, status: "on_track" },  { actual: 96, status: "completed" }, { actual: 1, status: "on_track" },  { actual: 2, status: "completed" }],
    ];
    const productQ2 = [
      [{ actual: 2, status: "on_track" }, null, { actual: 94, status: "on_track" }, null, null],
      [null, null, null, null, null],
      [{ actual: 2, status: "on_track" }, { actual: 13, status: "on_track" }, null, null, null],
    ];

    // Check if goals already exist
    const existingGoals = await Goal.countDocuments({ cycleYear: cy });
    if (existingGoals > 0) {
      console.log("⏭️   Goals already seeded, skipping goal creation");
    } else {
      const allGoals = [];
      const salesEmps = [emp1, emp2, emp3];
      const productEmps = [emp4, emp5, emp6];

      for (let ei = 0; ei < 3; ei++) {
        for (let gi = 0; gi < 5; gi++) {
          const g = salesGoals[gi];
          const achievements = [];
          if (salesQ1[ei][gi]) achievements.push({ quarter: "Q1", ...salesQ1[ei][gi], updatedAt: new Date("2025-04-05") });
          if (salesQ2[ei][gi]) achievements.push({ quarter: "Q2", ...salesQ2[ei][gi], updatedAt: new Date("2025-07-03") });

          allGoals.push({
            employeeId: salesEmps[ei]._id, cycleYear: cy, thrustArea: g.thrustArea, title: g.title,
            description: g.desc, uomType: g.uomType, target: g.target, weightage: g.weightage,
            deadline: g.deadline ? new Date(g.deadline) : new Date("2025-12-31"),
            status: "approved", isLocked: true, approvedAt: new Date("2025-01-15"),
            approvedBy: mgrSales._id, managerComment: "Aligned with department OKRs. Approved.", achievements,
          });
        }
      }

      for (let ei = 0; ei < 3; ei++) {
        for (let gi = 0; gi < 5; gi++) {
          const g = productGoals[gi];
          const achievements = [];
          if (productQ1[ei][gi]) achievements.push({ quarter: "Q1", ...productQ1[ei][gi], updatedAt: new Date("2025-04-05") });
          if (productQ2[ei][gi]) achievements.push({ quarter: "Q2", ...productQ2[ei][gi], updatedAt: new Date("2025-07-03") });

          allGoals.push({
            employeeId: productEmps[ei]._id, cycleYear: cy, thrustArea: g.thrustArea, title: g.title,
            description: g.desc, uomType: g.uomType, target: g.target, weightage: g.weightage,
            deadline: g.deadline ? new Date(g.deadline) : new Date("2025-12-31"),
            status: "approved", isLocked: true, approvedAt: new Date("2025-01-15"),
            approvedBy: mgrProduct._id, managerComment: "Good alignment with product roadmap. Approved.", achievements,
          });
        }
      }

      const createdGoals = await Goal.insertMany(allGoals);
      console.log(`🎯  Created ${createdGoals.length} goals (5 per employee, all approved)`);

      // ── Shared Goals ──────────────────────────────────────────────────
      const existingShared = await SharedGoal.countDocuments({});
      if (existingShared === 0) {
        await SharedGoal.create({ title: "Achieve ₹50L Department Revenue", description: "Combined Sales department quarterly revenue target.", thrustArea: "Revenue Growth", uomType: "min", target: 5000000, department: "Sales", weightage: 20, deadline: new Date("2025-12-31"), createdBy: mgrSales._id });
        await SharedGoal.create({ title: "Ship 10 Features This Year", description: "Product department collective feature delivery target.", thrustArea: "Product", uomType: "min", target: 10, department: "Product", weightage: 20, deadline: new Date("2025-12-31"), createdBy: mgrProduct._id });
        await SharedGoal.create({ title: "Achieve 90% Employee Satisfaction", description: "Cross-department employee satisfaction survey target.", thrustArea: "People", uomType: "min", target: 90, department: "All", weightage: 15, deadline: new Date("2025-12-31"), createdBy: admin._id });
        console.log("🔗  Created 3 shared goals");
      } else {
        console.log("⏭️   Shared goals already seeded, skipping");
      }

      // ── Check-ins ─────────────────────────────────────────────────────
      const existingCheckIns = await CheckIn.countDocuments({});
      if (existingCheckIns === 0) {
        await CheckIn.insertMany([
          { goalId: createdGoals[0]._id, employeeId: emp1._id, managerId: mgrSales._id, quarter: "Q1", plannedTarget: 500000, actualAchievement: 580000, comment: "Excellent Q1 performance! Revenue exceeded target by 16%. Keep up the momentum in Q2.", conductedAt: new Date("2025-04-10") },
          { goalId: createdGoals[5]._id, employeeId: emp2._id, managerId: mgrSales._id, quarter: "Q1", plannedTarget: 500000, actualAchievement: 420000, comment: "Q1 was below target but pipeline looks strong. Focus on closing the 3 pending enterprise deals.", conductedAt: new Date("2025-04-12") },
          { goalId: createdGoals[15]._id, employeeId: emp4._id, managerId: mgrProduct._id, quarter: "Q1", plannedTarget: 3, actualAchievement: 1, comment: "One feature shipped on time with zero regressions. Good quality. Need to accelerate cadence for Q2.", conductedAt: new Date("2025-04-08") },
        ]);
        console.log("📋  Created 3 manager check-in comments");
      } else {
        console.log("⏭️   Check-ins already seeded, skipping");
      }

      // ── Audit Logs ────────────────────────────────────────────────────
      const existingLogs = await AuditLog.countDocuments({});
      if (existingLogs === 0) {
        const auditEntries = [
          ...createdGoals.slice(0, 6).map((g) => ({ entityType: "goal", entityId: g._id, action: "goal_created", performedBy: g.employeeId, newValue: { title: g.title, weightage: g.weightage }, timestamp: new Date("2025-01-08") })),
          ...createdGoals.slice(0, 6).map((g) => ({ entityType: "goal", entityId: g._id, action: "goal_submitted", performedBy: g.employeeId, newValue: { title: g.title, status: "submitted" }, timestamp: new Date("2025-01-12") })),
          ...createdGoals.slice(0, 3).map((g) => ({ entityType: "goal", entityId: g._id, action: "approved", performedBy: mgrSales._id, newValue: { title: g.title, status: "approved" }, timestamp: new Date("2025-01-15") })),
          { entityType: "goal", entityId: createdGoals[1]._id, action: "inline_edit", performedBy: mgrSales._id, oldValue: { target: 30 }, newValue: { target: 24, title: "Reduce Customer Response Time" }, timestamp: new Date("2025-01-14") },
          { entityType: "goal", entityId: createdGoals[0]._id, action: "achievement_updated", performedBy: emp1._id, newValue: { quarter: "Q1", actual: 580000, score: 116 }, timestamp: new Date("2025-04-05") },
          { entityType: "goal", entityId: createdGoals[2]._id, action: "achievement_updated", performedBy: emp1._id, newValue: { quarter: "Q1", actual: 5, score: 33 }, timestamp: new Date("2025-04-05") },
          { entityType: "user", entityId: emp1._id, action: "user_created", performedBy: admin._id, newValue: { name: "Arjun Mehta", role: "employee", department: "Sales" }, timestamp: new Date("2025-01-05") },
          { entityType: "user", entityId: mgrSales._id, action: "user_created", performedBy: admin._id, newValue: { name: "Priya Sharma", role: "manager", department: "Sales" }, timestamp: new Date("2025-01-05") },
          { entityType: "goal", entityId: createdGoals[0]._id, action: "shared_goal_created", performedBy: mgrSales._id, newValue: { title: "Achieve ₹50L Department Revenue" }, timestamp: new Date("2025-01-20") },
        ];
        await AuditLog.insertMany(auditEntries);
        console.log(`📝  Created ${auditEntries.length} audit log entries`);
      } else {
        console.log("⏭️   Audit logs already seeded, skipping");
      }
    }

    // ── Summary ─────────────────────────────────────────────────────────
    console.log("\n🌱  ═══════════════════════════════════════════════");
    console.log("    SEED COMPLETE — Demo-ready data loaded!");
    console.log("    ═══════════════════════════════════════════════");
    console.log("    Password for ALL accounts: Demo@1234");
    console.log("");
    console.log("    ADMIN:     riya@goalsync.com");
    console.log("    MANAGERS:  priya@goalsync.com (Sales)");
    console.log("               rohit@goalsync.com (Product)");
    console.log("    EMPLOYEES: arjun@goalsync.com | kavya@goalsync.com | siddharth@goalsync.com (Sales)");
    console.log("               ananya@goalsync.com | rohan@goalsync.com | meera@goalsync.com (Product)");
    console.log("    ═══════════════════════════════════════════════\n");

    process.exit(0);
  } catch (err) {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  }
}

seed();
