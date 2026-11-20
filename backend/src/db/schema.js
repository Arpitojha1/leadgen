const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other'];
const STATUSES = ['New', 'Contacted', 'Qualified', 'Lost'];

const schemaSQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE,
    phone TEXT NOT NULL,
    company TEXT NOT NULL,
    source TEXT NOT NULL CHECK(source IN ('Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other')),
    status TEXT NOT NULL CHECK(status IN ('New', 'Contacted', 'Qualified', 'Lost')),
    deal_value NUMERIC DEFAULT 0 CHECK(deal_value >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, email)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lead_id INTEGER,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_leads_user_status ON leads (user_id, status);
  CREATE INDEX IF NOT EXISTS idx_leads_user_name ON leads (user_id, name);
  CREATE INDEX IF NOT EXISTS idx_leads_user_created ON leads (user_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_activity_user_created ON activity_logs (user_id, created_at);
`;

module.exports = {
  SOURCES,
  STATUSES,
  schemaSQL,
};
