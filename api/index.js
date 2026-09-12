/**
 * Vercel Serverless Function — wraps the Express app.
 * The app itself handles MongoDB connection via middleware.
 */
const app = require("../server/app");
module.exports = app;
