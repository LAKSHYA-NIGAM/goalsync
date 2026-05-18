const AuditLog = require("../models/AuditLog");

/**
 * Create an audit log entry.
 *
 * @param {Object} params
 * @param {import('mongoose').Types.ObjectId} params.entityId
 * @param {'goal'|'user'|'cycle'} params.entityType
 * @param {string} params.action
 * @param {import('mongoose').Types.ObjectId} params.performedBy
 * @param {*} [params.oldValue]
 * @param {*} [params.newValue]
 * @returns {Promise<import('mongoose').Document>}
 */
async function createLog({ entityId, entityType, action, performedBy, oldValue = null, newValue = null }) {
  try {
    return await AuditLog.create({
      entityId,
      entityType,
      action,
      performedBy,
      oldValue,
      newValue,
      timestamp: new Date(),
    });
  } catch (err) {
    // Audit logging should never break the main flow
    console.error("AuditLog write failed:", err.message);
    return null;
  }
}

module.exports = { createLog };
