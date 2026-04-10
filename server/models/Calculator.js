const mongoose = require('mongoose');

const CalculatorSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true,
    },
    title: { 
        type: String, 
        required: true 
    },
    defaultRate: { 
        type: Number, 
        required: true 
    },
    description: String,
    fields: [{
        name: String,
        label: String,
        type: { type: String, default: 'number' },
        required: { type: Boolean, default: true },
        min: Number,
        max: Number,
        step: Number
    }],
    isActive: { 
        type: Boolean, 
        default: true 
    },
    order: { 
        type: Number, 
        default: 0 
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Calculator', CalculatorSchema);
