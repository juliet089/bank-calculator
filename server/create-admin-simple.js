const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const createAdminSimple = async () => {
    try {
        console.log('🔌 Подключение к MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB подключена');
        
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        
        // Удаляем всех пользователей
        await usersCollection.deleteMany({});
        console.log('🗑️ Все пользователи удалены');
        
        // Хэшируем пароль вручную
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        // Создаем администратора
        await usersCollection.insertOne({
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log('✅ Администратор создан');
        console.log('   📧 Логин: admin');
        console.log('   🔑 Пароль: admin123');
        console.log('   🔐 Хэш пароля:', hashedPassword);
        
        // Проверяем, что пароль работает
        const admin = await usersCollection.findOne({ username: 'admin' });
        const isValid = await bcrypt.compare('admin123', admin.password);
        console.log(`🔍 Проверка пароля: ${isValid ? '✅ УСПЕШНО' : '❌ ОШИБКА'}`);
        
        await mongoose.disconnect();
        console.log('🔌 Отключено');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
};

createAdminSimple();