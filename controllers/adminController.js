const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');

// GET /api/admins
exports.getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().sort('-createdAt').lean();
        res.json(admins);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/admins
exports.createAdmin = async (req, res) => {
    const { username, password, permission } = req.body;
    console.log(req.body)
    try {
        const exists = await Admin.findOne({ username });
        if (exists) return res.status(400).json({ message: 'Username taken' });

        const hash = await bcrypt.hash(password, 10);
        const admin = new Admin({ username, password: hash, permission });
        await admin.save();
        res.status(201).json({ message: 'Admin created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/admins/:id
exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        await Admin.findByIdAndDelete(id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
