const { getDb } = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');
const { ALLOWED_SORT_COLUMNS } = require('../schemas/leadSchemas');
const { STATUSES } = require('../db/schema');

function createLead(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, email, phone, company, source, status } = req.body;
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
      INSERT INTO leads (user_id, name, email, phone, company, source, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(userId, name, email, phone, company, source, status);

    const newLead = db
      .prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?')
      .get(result.lastInsertRowid, userId);

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
      SELECT id, user_id, name, email, phone, company, source, status, created_at, updated_at
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

    const allowedFields = ['name', 'email', 'phone', 'company', 'source', 'status'];
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

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

function getStats(req, res, next) {
  try {
    const userId = req.user.id;
    const db = getDb();

    // Dashboard: total leads per status via one GROUP BY query
    const statsQuery = `
      SELECT status, COUNT(*) as count
      FROM leads
      WHERE user_id = ?
      GROUP BY status
    `;

    const rows = db.prepare(statsQuery).all(userId);

    // Initialize counts for all known statuses to 0
    const byStatus = {};
    for (const s of STATUSES) {
      byStatus[s] = 0;
    }

    let total = 0;
    for (const row of rows) {
      byStatus[row.status] = row.count;
      total += row.count;
    }

    return res.status(200).json({
      total,
      byStatus,
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
};
