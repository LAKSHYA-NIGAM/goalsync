/**
 * requireRole(...roles) — middleware factory
 *
 * Usage:
 *   router.get('/admin-only', verifyToken, requireRole('admin'), handler);
 *   router.get('/managers',   verifyToken, requireRole('manager', 'admin'), handler);
 *
 * Returns 403 if the authenticated user's role is not in the allowed list.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden — insufficient role" });
    }
    next();
  };
}

module.exports = { requireRole };
