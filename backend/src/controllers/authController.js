const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getDb } = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function signup(req, res, next) {
  try {
    const { email, password } = req.body;
    const db = getDb();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return next(new AppError('An account with this email already exists', 409, [
        { field: 'email', message: 'Email is already registered' },
      ]));
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const stmt = db.prepare(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)'
    );
    const result = stmt.run(email, passwordHash);

    const newUser = db.prepare(
      'SELECT id, email, created_at FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);

    const token = generateToken(newUser);

    return res.status(201).json({
      token,
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
}

function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const db = getDb();

    const user = db.prepare(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = ?'
    ).get(email);

    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };

    const token = generateToken(userPayload);

    return res.status(200).json({
      token,
      user: userPayload,
    });
  } catch (err) {
    next(err);
  }
}

function getMe(req, res) {
  return res.status(200).json({
    user: req.user,
  });
}

module.exports = {
  signup,
  login,
  getMe,
};
