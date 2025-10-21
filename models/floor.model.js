// ===============================
// Floor Model
// ===============================

const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema(
    {
        hostel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hostel',
            required: [true, 'Hostel reference is required']
        },
        floorNumber: {
            type: Number,
            required: [true, 'Floor number is required'],
            min: [0, 'Floor number cannot be negative']
        },
        floorName: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        totalRooms: {
            type: Number,
            default: 0,
            min: [0, 'Total rooms cannot be negative']
        },
        totalBeds: {
            type: Number,
            default: 0,
            min: [0, 'Total beds cannot be negative']
        },
        occupiedBeds: {
            type: Number,
            default: 0,
            min: [0, 'Occupied beds cannot be negative']
        },
        amenities: [{
            type: String,
            trim: true
        }],
        floorPlan: {
            type: String, // URL to floor plan image
            trim: true
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'under_maintenance'],
            default: 'active'
        }
    },
    {
        timestamps: true
    }
);

// Compound index to ensure unique floor number per hostel
floorSchema.index({ hostel: 1, floorNumber: 1 }, { unique: true });
floorSchema.index({ status: 1 });

module.exports = mongoose.model('Floor', floorSchema);


