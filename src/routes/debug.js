const express = require('express');
const router = express.Router();
const { firebaseStatus } = require('../controllers/debugController');

router.get('/firebase', firebaseStatus);

module.exports = router;
