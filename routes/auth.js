// routes/auth.js - BENAR
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route definitions...
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.getCurrentUser);
router.put('/update', authController.updateUser);

// EKSPOR YANG BENAR:
module.exports = router; // ✅ Gunakan module.exports