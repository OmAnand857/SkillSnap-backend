const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { signup, login, me, updateMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/signup', [body('email').isEmail(), body('password').isLength({ min: 6 })], signup);
router.post('/login', [body('email').isEmail(), body('password').exists()], login);
router.get('/me', authenticate, me);
router.put('/me', authenticate, updateMe);

module.exports = router;
