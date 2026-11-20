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
    let user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(decoded.userId);

    // If user record is missing in local container SQLite (serverless cold start recovery)
    if (!user && decoded.email) {
      user = db.prepare('SELECT id, email, created_at FROM users WHERE LOWER(email) = LOWER(?)').get(decoded.email);
      if (!user) {
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('Password123', 10);
        const insertRes = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(decoded.email.toLowerCase(), hash);
        user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(insertRes.lastInsertRowid);
        
        // Auto-seed sample data if it's the demo account
        if (decoded.email.toLowerCase() === 'demo@leadmanager.com') {
          const { resetDemoDataDirect } = require('../controllers/leadController');
          if (typeof resetDemoDataDirect === 'function') {
            resetDemoDataDirect(db, user.id);
          }
        }
      }
    }

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
