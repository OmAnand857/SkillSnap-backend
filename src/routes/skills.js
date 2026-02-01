const express = require('express');
const router = express.Router();
const { listSkills } = require('../controllers/skillsController');

router.get('/', listSkills);

module.exports = router;
