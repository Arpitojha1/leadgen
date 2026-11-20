const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Enable CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      // or match against allowed origin or in development
      if (!origin || config.nodeEnv === 'development' || origin === config.corsOrigin) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for assignment preview across ports
      }
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount domain routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// 404 Not Found handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
