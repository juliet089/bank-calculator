const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'admin',
        enum: ['admin', 'moderator']
    }
}, {
    timestamps: true
});

// Хэширование пароля перед сохранением
UserSchema.pre('save', async function(next) {
    // Если пароль не был изменен, пропускаем
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // Генерируем соль и хэшируем пароль
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Метод сравнения паролей
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error('Ошибка сравнения паролей:', error);
        return false;
    }
};

module.exports = mongoose.model('User', UserSchema);