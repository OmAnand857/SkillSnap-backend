const express = require('express');
const router = express.Router();
const { envStatus } = require('../controllers/envDebugController');

router.get('/', envStatus);

module.exports = router;