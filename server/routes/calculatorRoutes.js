const express = require('express');
const router = express.Router();
const Calculator = require('../models/Calculator');

// Получить все активные калькуляторы
router.get('/', async (req, res) => {
    try {
        const calculators = await Calculator.find({ isActive: true }).sort('order');
        res.json(calculators);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Получить конкретный калькулятор по имени
router.get('/:name', async (req, res) => {
    try {
        const calculator = await Calculator.findOne({ name: req.params.name, isActive: true });
        if (!calculator) {
            return res.status(404).json({ message: 'Калькулятор не найден' });
        }
        res.json(calculator);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;