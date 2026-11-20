const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const { schemaSQL } = require('./schema');

let dbInstance = null;

function initDb(dbPath = config.dbPath) {
  if (dbInstance) {
    return dbInstance;
  }

  // If file-based database, ensure parent directory exists
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  dbInstance = new Database(dbPath);

  // Enforce foreign key constraints
  dbInstance.pragma('foreign_keys = ON');

  // Enable WAL mode for high concurrency if not in memory
  if (dbPath !== ':memory:') {
    dbInstance.pragma('journal_mode = WAL');
  }

  // Run schema creation
  dbInstance.exec(schemaSQL);

  // Safe migration for deal_value if leads table already existed without it
  try {
    const columns = dbInstance.prepare("PRAGMA table_info(leads)").all();
    const hasDealValue = columns.some((c) => c.name === 'deal_value');
    if (!hasDealValue) {
      dbInstance.exec("ALTER TABLE leads ADD COLUMN deal_value NUMERIC DEFAULT 0 CHECK(deal_value >= 0)");
    }
  } catch {
    // Ignore migration errors if fresh table
  }

  return dbInstance;
}

function getDb() {
  if (!dbInstance) {
    return initDb();
  }
  return dbInstance;
}

function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  initDb,
  getDb,
  closeDb,
};
