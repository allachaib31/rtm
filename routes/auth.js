const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// login endpoint
router.post('/',authCtrl.login);
router.get('/verify', authMiddleware, authCtrl.verifyToken);


module.exports = router;