const { initDb, getDb, closeDb } = require('../src/db/connection');

function setupTestDatabase() {
  // Use in-memory SQLite database for high speed and full test isolation
  const db = initDb(':memory:');
  return db;
}

function clearDatabase() {
  const db = getDb();
  db.exec(`
    DELETE FROM leads;
    DELETE FROM users;
  `);
}

module.exports = {
  setupTestDatabase,
  clearDatabase,
  closeDb,
};
