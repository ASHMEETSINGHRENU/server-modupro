const AuditLog = require('../models/AuditLog');

async function recordAudit({ action, entityType, entityId = '', summary, req }) {
  try {
    const performedBy = req?.admin ? `${req.admin.name} (${req.admin.email})` : 'System';
    const ipAddress =
      req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      '';
    await AuditLog.create({
      action,
      entityType,
      entityId: String(entityId || ''),
      summary,
      performedBy,
      ipAddress,
    });
  } catch (err) {
    console.warn('[AuditService] Failed to write audit log:', err.message);
  }
}

module.exports = { recordAudit };
