const express = require('express');
const router = express.Router();
const Calculation = require('../models/Calculation');

// Сбор аналитики о расчетах
router.post('/calculation', async (req, res) => {
    try {
        const { calculatorType, inputData, resultData, userAgent, screenSize } = req.body;
        
        // Сохранение дополнительной аналитики
        // Можно добавить отдельную коллекцию для аналитики
        console.log(`Аналитика: ${calculatorType} - ${userAgent}`);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка сохранения аналитики:', error);
        res.status(500).json({ success: false });
    }
});

// Получение аналитики по устройствам
router.get('/devices', async (req, res) => {
    // Агрегация по userAgent
    res.json({ devices: [] });
});

module.exports = router;