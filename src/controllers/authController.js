const AdminUser = require('../models/AdminUser');
const {
  COOKIE_NAME,
  CSRF_COOKIE_NAME,
  generateCsrfToken,
  signAdminToken,
  getCookieOptions,
} = require('../middleware/authMiddleware');
const { recordAudit } = require('../services/auditService');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email address and password are required.',
      });
    }

    const admin = await AdminUser.findOne({
      email: String(email).toLowerCase().trim(),
    }).select('+passwordHash');

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator email or password.',
      });
    }

    const isMatch = await admin.comparePassword(String(password));
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator email or password.',
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = signAdminToken(admin);
    const csrfToken = generateCsrfToken();

    res.cookie(COOKIE_NAME, token, getCookieOptions(true));
    res.cookie(CSRF_COOKIE_NAME, csrfToken, getCookieOptions(false));

    await recordAudit({
      action: 'ADMIN_LOGIN',
      entityType: 'AdminUser',
      entityId: admin._id,
      summary: `Administrator ${admin.email} signed in`,
      req: { ...req, admin },
    });

    res.json({
      success: true,
      message: 'Signed in successfully.',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          lastLogin: admin.lastLogin,
        },
        token,
        csrfToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });

    if (req.admin) {
      await recordAudit({
        action: 'ADMIN_LOGOUT',
        entityType: 'AdminUser',
        entityId: req.admin._id,
        summary: `Administrator ${req.admin.email} signed out`,
        req,
      });
    }

    res.json({
      success: true,
      message: 'Signed out successfully.',
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  let csrfToken = req.cookies?.[CSRF_COOKIE_NAME];
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, csrfToken, getCookieOptions(false));
  }

  res.json({
    success: true,
    data: {
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
        lastLogin: req.admin.lastLogin,
      },
      csrfToken,
    },
  });
};
