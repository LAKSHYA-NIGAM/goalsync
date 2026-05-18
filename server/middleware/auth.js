const jwt = require("jsonwebtoken");

/**
 * verifyToken middleware
 * Reads the Authorization header, verifies the JWT, and attaches the decoded
 * payload to req.user = { id, role, name, department, managerId }.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name,
      department: decoded.department,
      managerId: decoded.managerId,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = { verifyToken };
