// ===============================
// Room Model
// ===============================

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
    {
        hostel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hostel',
            required: [true, 'Hostel reference is required']
        },
        floor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Floor',
            required: [true, 'Floor reference is required']
        },
        roomNumber: {
            type: String,
            required: [true, 'Room number is required'],
            trim: true
        },
        roomType: {
            type: String,
            enum: ['single', 'double', 'triple', 'quad', 'dormitory', 'suite'],
            required: [true, 'Room type is required']
        },
        totalBeds: {
            type: Number,
            required: [true, 'Total beds is required'],
            min: [1, 'Room must have at least 1 bed']
        },
        occupiedBeds: {
            type: Number,
            default: 0,
            min: [0, 'Occupied beds cannot be negative']
        },
        pricePerBed: {
            type: Number,
            required: [true, 'Price per bed is required'],
            min: [0, 'Price cannot be negative']
        },
        status: {
            type: String,
            enum: ['vacant', 'occupied', 'under_maintenance', 'reserved'],
            default: 'vacant'
        },
        amenities: [{
            type: String,
            trim: true
        }],
        dimensions: {
            length: { type: Number }, // in feet
            width: { type: Number },   // in feet
            area: { type: Number }     // in sq. feet
        },
        hasAttachedBathroom: {
            type: Boolean,
            default: false
        },
        hasBalcony: {
            type: Boolean,
            default: false
        },
        furnishing: {
            type: String,
            enum: ['furnished', 'semi-furnished', 'unfurnished'],
            default: 'furnished'
        },
        images: [{
            url: { type: String },
            caption: { type: String }
        }],
        maintenanceSchedule: [{
            date: { type: Date },
            description: { type: String },
            status: { 
                type: String, 
                enum: ['scheduled', 'in_progress', 'completed'],
                default: 'scheduled'
            }
        }],
        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Compound index to ensure unique room number per hostel
roomSchema.index({ hostel: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ status: 1 });
roomSchema.index({ floor: 1 });

// Virtual for vacancy status
roomSchema.virtual('isFullyOccupied').get(function() {
    return this.occupiedBeds >= this.totalBeds;
});

// Virtual for available beds
roomSchema.virtual('availableBeds').get(function() {
    return this.totalBeds - this.occupiedBeds;
});

// Method to update room status based on occupancy
roomSchema.methods.updateRoomStatus = function() {
    if (this.occupiedBeds === 0) {
        this.status = 'vacant';
    } else if (this.occupiedBeds >= this.totalBeds) {
        this.status = 'occupied';
    }
};

module.exports = mongoose.model('Room', roomSchema);


