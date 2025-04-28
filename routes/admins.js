const express = require('express');
const router  = express.Router();
const adminCtrl = require('../controllers/adminController');

// list all admins
router.get('/', adminCtrl.getAdmins);

// add new admin
router.post('/', adminCtrl.createAdmin);

// delete an admin
router.delete('/:id', adminCtrl.deleteAdmin);

module.exports = router;
