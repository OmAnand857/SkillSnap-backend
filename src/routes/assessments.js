const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getAssessmentHandler, submitAssessment } = require('../controllers/assessmentsController');

router.get('/:skillId', getAssessmentHandler);
router.post('/:skillId/submit', authenticate, submitAssessment);

module.exports = router;
