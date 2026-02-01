const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { execute } = require('../controllers/executeController');
const { executeLimiter } = require('../middleware/rateLimit');

router.post('/', authenticate, executeLimiter, [
  body('language_id').isInt(),
  body('source_code').isString().notEmpty(),
  body('question_id').isString().notEmpty(),
], execute);

module.exports = router;
