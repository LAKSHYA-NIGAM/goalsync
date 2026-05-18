const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(require('helmet')());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
// Serve React build in production (monolith deployment)
// ---------------------------------------------------------------------------
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

// ---------------------------------------------------------------------------
// MongoDB connection & server start
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/goalsync";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅  MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀  GoalSync API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌  MongoDB connection error:", err.message);
    process.exit(1);
  });
