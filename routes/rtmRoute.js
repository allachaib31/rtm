const express = require('express');
const RtmController = require('../controllers/rtmController');

const router = express.Router();

router.get('/getData', RtmController.getData);

module.exports = router;