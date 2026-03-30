const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authValidators } = require('../middleware/validators');

router.post('/register', authValidators.register, register);
router.post('/login', authValidators.login, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, authValidators.updateProfile, updateProfile);

module.exports = router;
