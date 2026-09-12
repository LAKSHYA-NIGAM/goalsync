/**
 * Vercel Serverless Function — wraps the Express app.
 *
 * Vercel invokes this handler for every /api/* request.
 * We lazily connect to MongoDB on the first invocation and cache the
 * connection across warm invocations (Vercel keeps the process alive
 * between requests for a short window).
 */
const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not set");
  }
  await mongoose.connect(MONGO_URI, {
    bufferCommands: false,
  });
  isConnected = true;
  console.log("✅  MongoDB connected (serverless)");
}

// Import the Express app
const app = require("../server/app");

// Wrap with DB connection middleware
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("❌  MongoDB connection error:", err.message);
    return res.status(500).json({ error: "Database connection failed" });
  }
  return app(req, res);
};
