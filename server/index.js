require("dotenv").config();

const app = require("./app");

// ---------------------------------------------------------------------------
// Server start (local development / Render)
// The app's /api middleware handles MongoDB connection automatically.
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀  GoalSync API running on http://localhost:${PORT}`);
});
