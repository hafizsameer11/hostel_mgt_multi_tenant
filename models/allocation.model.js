// ===============================
// Allocation Model (Tenant Assignment)
// ===============================

const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema(
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
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: [true, 'Room reference is required']
        },
        bed: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bed',
            required: [true, 'Bed reference is required']
        },
        tenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Tenant reference is required']
        },
        allocatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Allocator reference is required']
        },
        allocationDate: {
            type: Date,
            default: Date.now,
            required: true
        },
        checkInDate: {
            type: Date,
            required: [true, 'Check-in date is required']
        },
        checkOutDate: {
            type: Date,
            default: null
        },
        expectedCheckOutDate: {
            type: Date,
            default: null
        },
        rentAmount: {
            type: Number,
            required: [true, 'Rent amount is required'],
            min: [0, 'Rent amount cannot be negative']
        },
        depositAmount: {
            type: Number,
            default: 0,
            min: [0, 'Deposit amount cannot be negative']
        },
        status: {
            type: String,
            enum: ['active', 'checked_out', 'transferred', 'cancelled'],
            default: 'active'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'partial', 'overdue'],
            default: 'pending'
        },
        transferHistory: [{
            fromBed: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'Bed' 
            },
            toBed: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'Bed' 
            },
            transferDate: { type: Date, default: Date.now },
            reason: { type: String },
            transferredBy: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'User' 
            }
        }],
        notes: {
            type: String,
            trim: true
        },
        documents: [{
            name: { type: String },
            url: { type: String },
            uploadedAt: { type: Date, default: Date.now }
        }]
    },
    {
        timestamps: true
    }
);

// Indexes for better query performance
allocationSchema.index({ tenant: 1, status: 1 });
allocationSchema.index({ bed: 1, status: 1 });
allocationSchema.index({ room: 1, status: 1 });
allocationSchema.index({ hostel: 1, status: 1 });
allocationSchema.index({ allocationDate: -1 });

// Ensure only one active allocation per bed
allocationSchema.index(
    { bed: 1, status: 1 }, 
    { 
        unique: true,
        partialFilterExpression: { status: 'active' }
    }
);

module.exports = mongoose.model('Allocation', allocationSchema);


