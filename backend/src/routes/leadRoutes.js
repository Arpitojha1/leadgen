const express = require('express');
const {
  createLead,
  listLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getStats,
  getActivity,
  resetDemoData,
} = require('../controllers/leadController');
const { requireAuth } = require('../middleware/auth');
const { validateBody, validateQuery } = require('../middleware/validate');
const {
  createLeadSchema,
  updateLeadSchema,
  listLeadsQuerySchema,
} = require('../schemas/leadSchemas');

const router = express.Router();

// All lead endpoints require authentication
router.use(requireAuth);

// Leads stats and auxiliary endpoints (placed before /:id)
router.get('/stats', getStats);
router.get('/activity', getActivity);
router.post('/demo-reset', resetDemoData);

// Lead collection endpoints
router.post('/', validateBody(createLeadSchema), createLead);
router.get('/', validateQuery(listLeadsQuerySchema), listLeads);

// Lead individual item endpoints
router.get('/:id', getLeadById);
router.put('/:id', validateBody(updateLeadSchema), updateLead);
router.delete('/:id', deleteLead);

module.exports = router;
