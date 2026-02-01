const express = require('express');
const router = express.Router();
const { createCertificate, getCertificate } = require('../controllers/certificatesController');

// POST is open (no auth required) — consider adding auth in production
router.post('/', createCertificate);
router.get('/:id', getCertificate);

module.exports = router;
