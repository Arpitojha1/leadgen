const { getDb } = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');
const { ALLOWED_SORT_COLUMNS } = require('../schemas/leadSchemas');
const { STATUSES } = require('../db/schema');

function logActivity(db, userId, leadId, message, type) {
  try {
    db.prepare(`
      INSERT INTO activity_logs (user_id, lead_id, message, type)
      VALUES (?, ?, ?, ?)
    `).run(userId, leadId, message, type);
  } catch {
    // Non-blocking error for activity logs
  }
}

const CANONICAL_DEMO_LEADS = [
  { name: 'Alice Chen', email: 'alice@techflow.io', phone: '555-0142', company: 'TechFlow Solutions', source: 'LinkedIn', status: 'New', deal_value: 14500 },
  { name: 'Marcus Johnson', email: 'marcus@greenleaf.com', phone: '555-0187', company: 'GreenLeaf Organics', source: 'Referral', status: 'Contacted', deal_value: 7500 },
  { name: 'Sophia Ramirez', email: 'sophia.ramirez@buildrite.net', phone: '555-0163', company: 'BuildRite Construction', source: 'Website', status: 'Qualified', deal_value: 32000 },
  { name: 'David Kim', email: 'david.kim@novacore.io', phone: '555-0199', company: 'NovaCore Analytics', source: 'Cold Call', status: 'Lost', deal_value: 8000 },
  { name: 'Emma Patel', email: 'emma@horizonmedia.com', phone: '555-0134', company: 'Horizon Media Group', source: 'Event', status: 'New', deal_value: 10000 },
  { name: "James O'Connor", email: 'james.oconnor@steelbridge.co', phone: '555-0175', company: 'SteelBridge Logistics', source: 'Other', status: 'Contacted', deal_value: 12500 },
  { name: 'Priya Nair', email: 'priya.nair@brightpath.edu', phone: '555-0151', company: 'BrightPath Education', source: 'Website', status: 'Qualified', deal_value: 24000 },
  { name: 'Liam Brooks', email: 'liam.brooks@velocitysports.com', phone: '555-0129', company: 'Velocity Sports', source: 'Referral', status: 'Lost', deal_value: 6500 },
  { name: 'Olivia Torres', email: 'olivia.torres@urbandesign.studio', phone: '555-0182', company: 'Urban Design Studio', source: 'LinkedIn', status: 'New', deal_value: 15500 },
  { name: 'Noah Singh', email: 'noah.singh@cloudfirst.ai', phone: '555-0148', company: 'CloudFirst AI', source: 'Cold Call', status: 'Contacted', deal_value: 18000 },
];

function createLead(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, email, phone, company, source, status, deal_value = 0 } = req.body;
    const db = getDb();

    // Check duplicate email for this user
    const existing = db
      .prepare('SELECT id FROM leads WHERE user_id = ? AND email = ?')
      .get(userId, email);

    if (existing) {
      return next(
        new AppError('A lead with this email already exists for your account', 409, [
          { field: 'email', message: 'Lead with this email already exists' },
        ])
      );
    }

    const stmt = db.prepare(`
      INSERT INTO leads (user_id, name, email, phone, company, source, status, deal_value)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(userId, name, email, phone, company, source, status, deal_value || 0);

    const newLead = db
      .prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?')
      .get(result.lastInsertRowid, userId);

    logActivity(db, userId, result.lastInsertRowid, `${name} from ${company} was added as a ${source} lead.`, 'created');

    return res.status(201).json({
      data: newLead,
    });
  } catch (err) {
    next(err);
  }
}

function listLeads(req, res, next) {
  try {
    const userId = req.user.id;
    const query = req.validatedQuery || req.query;
    const search = (query.search || '').trim();
    const status = (query.status || '').trim();
    const source = (query.source || '').trim();
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
    const sortBy = query.sortBy;
    const order = query.order;
    const db = getDb();

    const conditions = ['leads.user_id = ?'];
    const params = [userId];

    if (search !== '') {
      conditions.push('LOWER(leads.name) LIKE ?');
      params.push(`%${search.toLowerCase()}%`);
    }

    if (status !== '') {
      conditions.push('leads.status = ?');
      params.push(status);
    }

    if (source !== '') {
      conditions.push('leads.source = ?');
      params.push(source);
    }

    const whereClause = conditions.join(' AND ');

    // 1. Total count query
    const countQuery = `SELECT COUNT(*) as total FROM leads WHERE ${whereClause}`;
    const countRow = db.prepare(countQuery).get(...params);
    const total = countRow ? countRow.total : 0;

    // 2. Sorting and pagination
    // Whitelist check
    const sortColumn = ALLOWED_SORT_COLUMNS.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    const selectQuery = `
      SELECT id, user_id, name, email, phone, company, source, status, deal_value, created_at, updated_at
      FROM leads
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const leads = db.prepare(selectQuery).all(...params, limit, offset);

    return res.status(200).json({
      data: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

function getLeadById(req, res, next) {
  try {
    const userId = req.user.id;
    const leadId = parseInt(req.params.id, 10);

    if (isNaN(leadId)) {
      return next(new AppError('Invalid lead ID', 400));
    }

    const db = getDb();
    const lead = db
      .prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?')
      .get(leadId, userId);

    if (!lead) {
      return next(new AppError('Lead not found', 404));
    }

    return res.status(200).json({
      data: lead,
    });
  } catch (err) {
    next(err);
  }
}

function updateLead(req, res, next) {
  try {
    const userId = req.user.id;
    const leadId = parseInt(req.params.id, 10);

    if (isNaN(leadId)) {
      return next(new AppError('Invalid lead ID', 400));
    }

    const db = getDb();

    // Check if lead exists and belongs to current user
    const existing = db
      .prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?')
      .get(leadId, userId);

    if (!existing) {
      return next(new AppError('Lead not found', 404));
    }

    // Check duplicate email if email is being updated
    if (req.body.email && req.body.email.toLowerCase() !== existing.email.toLowerCase()) {
      const emailConflict = db
        .prepare('SELECT id FROM leads WHERE user_id = ? AND email = ? AND id != ?')
        .get(userId, req.body.email, leadId);

      if (emailConflict) {
        return next(
          new AppError('A lead with this email already exists for your account', 409, [
            { field: 'email', message: 'Lead with this email already exists' },
          ])
        );
      }
    }

    const fieldsToUpdate = [];
    const updateParams = [];

    const allowedFields = ['name', 'email', 'phone', 'company', 'source', 'status', 'deal_value'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fieldsToUpdate.push(`${field} = ?`);
        updateParams.push(req.body[field]);
      }
    }

    fieldsToUpdate.push("updated_at = CURRENT_TIMESTAMP");

    const updateQuery = `
      UPDATE leads
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = ? AND user_id = ?
    `;

    updateParams.push(leadId, userId);
    db.prepare(updateQuery).run(...updateParams);

    const updatedLead = db
      .prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?')
      .get(leadId, userId);

    if (req.body.status && req.body.status !== existing.status) {
      logActivity(db, userId, leadId, `${existing.name} from ${existing.company} was moved to ${req.body.status}.`, 'status_changed');
    } else {
      logActivity(db, userId, leadId, `${existing.name} from ${existing.company} was updated.`, 'updated');
    }

    return res.status(200).json({
      data: updatedLead,
    });
  } catch (err) {
    next(err);
  }
}

function deleteLead(req, res, next) {
  try {
    const userId = req.user.id;
    const leadId = parseInt(req.params.id, 10);

    if (isNaN(leadId)) {
      return next(new AppError('Invalid lead ID', 400));
    }

    const db = getDb();

    // Enforce user_id isolation (return 404 for other users' leads)
    const existing = db
      .prepare('SELECT id FROM leads WHERE id = ? AND user_id = ?')
      .get(leadId, userId);

    if (!existing) {
      return next(new AppError('Lead not found', 404));
    }

    db.prepare('DELETE FROM leads WHERE id = ? AND user_id = ?').run(leadId, userId);

    logActivity(db, userId, null, `${existing.name} from ${existing.company} was removed.`, 'deleted');

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

function getStats(req, res, next) {
  try {
    const userId = req.user.id;
    const db = getDb();

    // 1. Leads counts per status
    const statsQuery = `
      SELECT status, COUNT(*) as count
      FROM leads
      WHERE user_id = ?
      GROUP BY status
    `;

    const rows = db.prepare(statsQuery).all(userId);

    const byStatus = {};
    for (const s of STATUSES) {
      byStatus[s] = 0;
    }

    let total = 0;
    for (const row of rows) {
      byStatus[row.status] = row.count;
      total += row.count;
    }

    // 2. Qualified value
    const qRow = db.prepare(`
      SELECT COALESCE(SUM(deal_value), 0) as val
      FROM leads
      WHERE user_id = ? AND status = 'Qualified'
    `).get(userId);
    const qualifiedValue = qRow ? qRow.val : 0;

    // 3. Pipeline value (sum of all leads)
    const pRow = db.prepare(`
      SELECT COALESCE(SUM(deal_value), 0) as val
      FROM leads
      WHERE user_id = ?
    `).get(userId);
    const pipelineValue = pRow ? pRow.val : 0;

    // 4. Value by source (for bar chart)
    const sourceRows = db.prepare(`
      SELECT source, COALESCE(SUM(deal_value), 0) as value
      FROM leads
      WHERE user_id = ?
      GROUP BY source
    `).all(userId);
    const sourceMap = {};
    for (const r of sourceRows) {
      sourceMap[r.source] = r.value;
    }
    const bySource = ['LinkedIn', 'Referral', 'Website', 'Event', 'Other', 'Cold Call'].map((src) => ({
      source: src,
      value: sourceMap[src] || 0,
    }));

    return res.status(200).json({
      total,
      byStatus,
      qualifiedValue,
      pipelineValue,
      bySource,
    });
  } catch (err) {
    next(err);
  }
}

function getActivity(req, res, next) {
  try {
    const userId = req.user.id;
    const db = getDb();

    const activities = db.prepare(`
      SELECT id, user_id, lead_id, message, type, created_at
      FROM activity_logs
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 10
    `).all(userId);

    return res.status(200).json({
      data: activities,
    });
  } catch (err) {
    next(err);
  }
}

function resetDemoData(req, res, next) {
  try {
    const userId = req.user.id;
    const db = getDb();

    const resetTx = db.transaction(() => {
      // Clear existing leads & activity logs for user
      db.prepare('DELETE FROM leads WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM activity_logs WHERE user_id = ?').run(userId);

      const insertLead = db.prepare(`
        INSERT INTO leads (user_id, name, email, phone, company, source, status, deal_value, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
      `);

      // Insert in reverse order with incremented timestamps so newest/DESC query has Alice Chen first
      const count = CANONICAL_DEMO_LEADS.length;
      for (let i = 0; i < count; i++) {
        const lead = CANONICAL_DEMO_LEADS[i];
        // Alice Chen gets highest timestamp (+10 seconds), Noah Singh gets (+1 second)
        const offsetSec = `+${count - i} seconds`;
        insertLead.run(userId, lead.name, lead.email, lead.phone, lead.company, lead.source, lead.status, lead.deal_value, offsetSec);
      }

      const insertActivity = db.prepare(`
        INSERT INTO activity_logs (user_id, message, type, created_at)
        VALUES (?, ?, ?, datetime('now', ?))
      `);

      // 3 items matching ref-3 in order (item 1 newest, item 3 oldest)
      insertActivity.run(userId, 'Alice Chen from TechFlow Solutions was moved to Contacted.', 'status_changed', '+3 seconds');
      insertActivity.run(userId, 'Marcus Johnson from GreenLeaf Organics was added as a Referral lead.', 'created', '+2 seconds');
      insertActivity.run(userId, 'A new Website lead requested a demo for a $12,000 opportunity.', 'demo_seeded', '+1 seconds');
    });

    resetTx();

    return res.status(200).json({
      message: 'Demo data reset successfully',
      count: CANONICAL_DEMO_LEADS.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createLead,
  listLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getStats,
  getActivity,
  resetDemoData,
};
