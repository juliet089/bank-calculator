const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
    try {
        console.log('🔌 Подключение к MongoDB...');
        console.log(`URI: ${process.env.MONGODB_URI}`);
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB подключена успешно');
        
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        
        // Удаляем существующего администратора
        await usersCollection.deleteMany({ username: 'admin' });
        console.log('🗑️ Старый администратор удален');
        
        // Хэшируем пароль вручную
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        // Создаем нового администратора
        await usersCollection.insertOne({
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log('\n✅ Администратор успешно создан:');
        console.log('   📧 Логин: admin');
        console.log('   🔑 Пароль: admin123');
        
        // Проверяем, что пароль работает
        const savedAdmin = await usersCollection.findOne({ username: 'admin' });
        const isValid = await bcrypt.compare('admin123', savedAdmin.password);
        console.log(`🔍 Проверка пароля: ${isValid ? '✅ УСПЕШНО' : '❌ ОШИБКА'}`);
        
        await mongoose.disconnect();
        console.log('🔌 Отключено от MongoDB');
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        process.exit(1);
    }
};

createAdmin();