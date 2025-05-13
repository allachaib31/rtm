const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_prod';

exports.login = async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body)
    try {
        const user = await Admin.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        console.log(user);
        user.permission.Journal = true
        user.permission.CreditGlobal = true
        const token = jwt.sign({ id: user._id, username, permission: user.permission }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.verifyToken = async (req, res) => {
    // authMiddleware has already put payload on req.user
    res.json({ valid: true, user: req.user });
  };

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
