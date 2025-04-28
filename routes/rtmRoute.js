const express = require('express');
const RtmController = require('../controllers/rtmController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/getData', authMiddleware, RtmController.getData);

module.exports = router;