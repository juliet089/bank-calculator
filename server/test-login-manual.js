const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Подключено к MongoDB');
        
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        
        // Находим администратора
        const admin = await usersCollection.findOne({ username: 'admin' });
        
        if (!admin) {
            console.log('❌ Администратор не найден');
            return;
        }
        
        console.log('👤 Найден пользователь:', admin.username);
        console.log('🔐 Хэш пароля:', admin.password);
        
        // Тестируем сравнение паролей
        const testPassword = 'admin123';
        const isValid = await bcrypt.compare(testPassword, admin.password);
        
        console.log(`🔍 Проверка пароля "${testPassword}": ${isValid ? '✅ ВЕРНЫЙ' : '❌ НЕВЕРНЫЙ'}`);
        
        if (isValid) {
            console.log('\n🎉 Вход в админ-панель будет успешным!');
            console.log('Откройте http://localhost:3000/admin');
            console.log('Логин: admin');
            console.log('Пароль: admin123');
        } else {
            console.log('\n⚠️ Пароль не совпадает. Нужно создать администратора заново.');
        }
        
        await mongoose.disconnect();
        
    } catch (error) {
        console.error('Ошибка:', error);
    }
};

testLogin();