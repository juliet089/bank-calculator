const mongoose = require('mongoose');
const Calculation = require('../models/Calculation');
require('dotenv').config();

const createIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Подключено к MongoDB');
        
        // Создание всех индексов
        await Calculation.createIndexes();
        console.log('✅ Индексы созданы');
        
        // Получение списка индексов
        const indexes = await Calculation.collection.indexes();
        console.log('\n📋 Список индексов:');
        indexes.forEach(index => {
            console.log(`   - ${JSON.stringify(index.key)} (${index.name})`);
        });
        
        await mongoose.disconnect();
        console.log('\n🔌 Отключено');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
};

createIndexes();