const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getDb } = require('../db/connection');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required: missing or malformed Bearer token',
      details: [],
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const db = getDb();
    const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: 'User account no longer exists',
        details: [],
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired, please log in again',
        details: [],
      });
    }
    return res.status(401).json({
      error: 'Invalid authentication token',
      details: [],
    });
  }
}

module.exports = {
  requireAuth,
};
