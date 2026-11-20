const express = require('express');
const { signup, login, getMe } = require('../controllers/authController');
const { validateBody } = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../schemas/authSchemas');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', validateBody(signupSchema), signup);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', requireAuth, getMe);

module.exports = router;
