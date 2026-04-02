const express = require('express');
const router = express.Router();
const Calculation = require('../models/Calculation');
const { 
    calculateMortgage, 
    calculateAutocredit, 
    calculateConsumer,
    calculatePension 
} = require('../utils/loanCalculator');

// Получение ставок по умолчанию (можно вынести в конфиг)
const DEFAULT_RATES = {
    mortgage: 9.6,
    autocredit: 3.5,
    consumer: 14.5,
    pension: 7.0 // для пенсионных накоплений
};

// Маршрут для отправки результата на email
router.post('/send-email', async (req, res) => {
    try {
        const { email, calculatorType, inputData, resultData } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email не указан' 
            });
        }
        
        if (!calculatorType || !inputData || !resultData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Недостаточно данных для отправки' 
            });
        }
        
        // Валидация email
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Неверный формат email' 
            });
        }
        
        const { sendCalculationResult } = require('../utils/emailService');
        
        // Отправляем email
        await sendCalculationResult(email, calculatorType, inputData, resultData);
        
        // Обновляем запись в БД, добавляя email
        const userIp = req.ip || req.connection.remoteAddress;
        await Calculation.findOneAndUpdate(
            { 
                userIp: userIp, 
                calculatorType: calculatorType,
                'inputData': inputData
            },
            { $set: { userEmail: email } },
            { sort: { createdAt: -1 } }
        );
        
        res.json({ 
            success: true, 
            message: 'Результаты успешно отправлены на указанный email' 
        });
        
    } catch (error) {
        console.error('Ошибка отправки email:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Не удалось отправить результаты на email' 
        });
    }
});

// Маршрут для расчета
router.post('/', async (req, res) => {
    try {
        const { type, inputData } = req.body;
        let result;
        
        // Получаем IP пользователя
        const userIp = req.ip || req.connection.remoteAddress;
        
        switch(type) {
            case 'mortgage':
                result = calculateMortgage(
                    inputData.propertyPrice,
                    inputData.downPayment,
                    DEFAULT_RATES.mortgage,
                    inputData.years
                );
                break;
            case 'autocredit':
                result = calculateAutocredit(
                    inputData.carPrice,
                    inputData.downPayment,
                    DEFAULT_RATES.autocredit,
                    inputData.years
                );
                break;
            case 'consumer':
                result = calculateConsumer(
                    inputData.amount,
                    DEFAULT_RATES.consumer,
                    inputData.years
                );
                break;
            case 'pension':
                result = calculatePension(
                    inputData.currentSavings || 0,
                    inputData.monthlyContribution || 0,
                    inputData.years,
                    DEFAULT_RATES.pension
                );
                break;
            default:
                return res.status(400).json({ message: 'Неизвестный тип калькулятора' });
        }
        
        // Сохраняем расчет в базу данных
        const calculation = new Calculation({
            calculatorType: type,
            inputData: inputData,
            resultData: result,
            userIp: userIp
        });
        
        await calculation.save();
        
        res.json({
            success: true,
            result: result
        });
        
    } catch (error) {
        console.error('Ошибка расчета:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Ошибка при выполнении расчета' 
        });
    }
});

// Маршрут для отправки результата на email
router.post('/send-email', async (req, res) => {
    try {
        const { email, result, calculatorType } = req.body;
        
        if (!email || !result) {
            return res.status(400).json({ message: 'Не указан email или данные расчета' });
        }
        
        const { sendCalculationResult } = require('../utils/emailService');
        
        // Получаем название калькулятора
        const calculatorNames = {
            mortgage: 'Ипотечный калькулятор',
            autocredit: 'Автокредит',
            consumer: 'Потребительский кредит',
            pension: 'Пенсионный калькулятор'
        };
        
        await sendCalculationResult(
            email,
            result,
            calculatorNames[calculatorType] || 'Финансовый калькулятор'
        );
        
        // Обновляем запись в БД, добавляя email
        // (можно найти последний расчет по IP и типу)
        const userIp = req.ip || req.connection.remoteAddress;
        await Calculation.findOneAndUpdate(
            { userIp: userIp, calculatorType: calculatorType },
            { $set: { userEmail: email } },
            { sort: { createdAt: -1 } }
        );
        
        res.json({ 
            success: true, 
            message: 'Результаты отправлены на указанный email' 
        });
        
    } catch (error) {
        console.error('Ошибка отправки email:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Не удалось отправить результаты на email' 
        });
    }
});

module.exports = router;