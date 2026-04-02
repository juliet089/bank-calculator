const mongoose = require('mongoose');

/**
 * Схема расчета финансового калькулятора
 */
const CalculationSchema = new mongoose.Schema({
    calculatorType: { 
        type: String, 
        required: true,
        enum: ['mortgage', 'autocredit', 'consumer', 'pension']
    },
    inputData: { 
        type: Object, 
        required: true 
    },
    resultData: { 
        type: Object, 
        required: true 
    },
    userEmail: { 
        type: String, 
        lowercase: true, 
        trim: true 
    },
    userIp: { 
        type: String 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// ============================================
// ИНДЕКСЫ
// ============================================
CalculationSchema.index({ createdAt: -1 });
CalculationSchema.index({ calculatorType: 1 });
CalculationSchema.index({ calculatorType: 1, createdAt: -1 });
CalculationSchema.index({ userEmail: 1 });
CalculationSchema.index({ userIp: 1 });

// ============================================
// ВИРТУАЛЬНЫЕ ПОЛЯ
// ============================================
CalculationSchema.virtual('formattedDate').get(function() {
    return this.createdAt ? this.createdAt.toLocaleString('ru-RU') : '—';
});

CalculationSchema.virtual('loanAmount').get(function() {
    if (this.calculatorType === 'mortgage') {
        return (this.inputData?.propertyPrice || 0) - (this.inputData?.downPayment || 0);
    }
    if (this.calculatorType === 'autocredit') {
        return (this.inputData?.carPrice || 0) - (this.inputData?.downPayment || 0);
    }
    if (this.calculatorType === 'consumer') {
        return this.inputData?.amount || 0;
    }
    if (this.calculatorType === 'pension') {
        return this.inputData?.currentSavings || 0;
    }
    return null;
});

CalculationSchema.virtual('monthlyPayment').get(function() {
    return this.resultData?.monthlyPayment || this.resultData?.totalSavings || null;
});

// ============================================
// СТАТИЧЕСКИЕ МЕТОДЫ
// ============================================
CalculationSchema.statics.getStats = async function(options = {}) {
    const { startDate, endDate, calculatorType } = options;
    
    const match = {};
    if (startDate) match.createdAt = { $gte: new Date(startDate) };
    if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
    if (calculatorType) match.calculatorType = calculatorType;
    
    const result = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$calculatorType',
                count: { $sum: 1 },
                avgMonthlyPayment: { $avg: '$resultData.monthlyPayment' }
            }
        }
    ]);
    
    return result;
};

CalculationSchema.statics.findWithPagination = async function(query = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
        this.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
        this.countDocuments(query)
    ]);
    
    return { data, total, page, pages: Math.ceil(total / limit), limit };
};

// ============================================
// МЕТОДЫ ЭКЗЕМПЛЯРА
// ============================================
CalculationSchema.methods.updateEmail = async function(email) {
    if (email && email !== this.userEmail) {
        this.userEmail = email;
        this.updatedAt = new Date();
        await this.save();
        return true;
    }
    return false;
};

CalculationSchema.methods.getAgeInDays = function() {
    const now = new Date();
    const diffTime = Math.abs(now - this.createdAt);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ============================================
// ЭКСПОРТ
// ============================================
module.exports = mongoose.model('Calculation', CalculationSchema);