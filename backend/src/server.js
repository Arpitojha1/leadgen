const app = require('./app');
const config = require('./config/env');
const { initDb, closeDb } = require('./db/connection');

// Initialize database
try {
  initDb();
  console.log(`Database connected successfully at: ${config.dbPath}`);
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

const server = app.listen(config.port, () => {
  console.log(`Lead Manager API server is running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
function shutdown() {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    closeDb();
    console.log('Database connection closed. Exiting process.');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = server;
