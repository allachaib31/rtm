const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    CashVan: { type: Boolean, default: false },
    Commande: { type: Boolean, default: false },
    Livraison: { type: Boolean, default: false },
    Credit: { type: Boolean, default: false },
    SoldDetails: { type: Boolean, default: false },
    RecapVendeur: { type: Boolean, default: false },
    RecapRegional: { type: Boolean, default: false },
    ClientInactive: { type: Boolean, default: false },
    FakePosition: { type: Boolean, default: false },
    Journal: { type: Boolean, default: false },
    ClientVisiterNonProgrammer: { type: Boolean, default: false },
});

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    permission: { type: permissionSchema, default: () => ({}) }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
