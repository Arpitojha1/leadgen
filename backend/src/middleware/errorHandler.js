class AppError extends Error {
  constructor(message, statusCode = 500, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function errorHandler(err, req, res, next) {
  // If response has already sent headers, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle JSON parse error from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON payload',
      details: [{ field: 'body', message: 'Invalid JSON format' }],
    });
  }

  // Handle SQLite Unique Constraint Violation
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || (err.message && err.message.includes('UNIQUE constraint failed'))) {
    if (err.message.includes('users.email')) {
      return res.status(409).json({
        error: 'An account with this email already exists',
        details: [{ field: 'email', message: 'Email is already registered' }],
      });
    }
    if (err.message.includes('leads.user_id, leads.email')) {
      return res.status(409).json({
        error: 'A lead with this email already exists for your account',
        details: [{ field: 'email', message: 'Lead with this email already exists' }],
      });
    }
    return res.status(409).json({
      error: 'Resource with duplicate unique field already exists',
      details: [],
    });
  }

  // Handle SQLite Check Constraint Violation
  if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
    return res.status(400).json({
      error: 'Database constraint violation: check constraint failed',
      details: [{ field: 'database', message: err.message }],
    });
  }

  // Handle Custom Operational Errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details || [],
    });
  }

  // Log unexpected errors
  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Server Error:', err);
  }

  return res.status(500).json({
    error: 'Internal server error',
    details: [],
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    details: [],
  });
}

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
};
