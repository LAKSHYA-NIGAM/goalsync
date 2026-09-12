const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(require('helmet')());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// DB connection middleware (ensures MongoDB is connected before handling API)
// Uses the SAME mongoose instance that the models/routes use.
// ---------------------------------------------------------------------------
app.use("/api", async (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    return res.status(500).json({ error: "MONGO_URI environment variable is not set" });
  }

  try {
    if (mongoose.connection.readyState !== 0) {
      try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
    }
    await mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log("✅  MongoDB connected");
    next();
  } catch (err) {
    console.error("❌  MongoDB connection error:", err.message);
    return res.status(500).json({ error: "Database connection failed", detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// Routes (mount here as they are created)
// ---------------------------------------------------------------------------
app.use("/api/auth", require("./routes/auth"));
app.use("/api/goals",    require("./routes/goals"));
app.use("/api/checkins", require("./routes/checkins"));
app.use("/api/shared-goals", require("./routes/sharedGoals"));
app.use("/api/ai",           require("./routes/ai"));
app.use("/api/admin",        require("./routes/admin"));
app.use("/api/reports",      require("./routes/reports"));
// app.use("/api/users",    require("./routes/users"));

// Health-check endpoint
app.get("/api/health", (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({ status: "ok", timestamp: new Date().toISOString(), dbConnected, uptime: Math.floor(process.uptime()) + "s" });
});

// ---------------------------------------------------------------------------
// Serve React build in production (monolith deployment — used on Render/local)
// In Vercel, static files are served separately so this is harmless.
// ---------------------------------------------------------------------------
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

module.exports = app;
