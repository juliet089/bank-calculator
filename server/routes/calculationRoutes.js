const express = require('express');
const router = express.Router();
const Calculation = require('../models/Calculation');
const { 
    calculateMortgage, 
    calculateAutocredit, 
    calculateConsumer,
    calculatePension 
} = require('../utils/loanCalculator');

// Ставки по умолчанию
const DEFAULT_RATES = {
    mortgage: 9.6,
    autocredit: 3.5,
    consumer: 14.5,
    pension: 7.0
};

// Маршрут для расчета
router.post('/', async (req, res) => {
    try {
        const { type, inputData } = req.body;
        let result;
        
        const userIp = req.ip || req.connection.remoteAddress;
        
        console.log(`📊 Расчет: ${type}`, inputData);
        
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
                return res.status(400).json({ 
                    success: false, 
                    message: 'Неизвестный тип калькулятора: ' + type 
                });
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
        console.error('❌ Ошибка расчета:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Ошибка при выполнении расчета' 
        });
    }
});

// Маршрут для отправки результата на email
router.post('/send-email', async (req, res) => {
    try {
        const { email, calculatorType, inputData, resultData } = req.body;
        
        console.log(`📧 Запрос на отправку email на ${email}`);
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email не указан' 
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
        const result = await sendCalculationResult(email, calculatorType, inputData, resultData);
        
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
            message: result.demo 
                ? 'Функция отправки email реализована. Для реальной отправки настройте SendGrid.'
                : 'Результаты успешно отправлены на указанный email',
            demo: result.demo || false
        });
        
    } catch (error) {
        console.error('❌ Ошибка отправки email:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Не удалось отправить результаты на email' 
        });
    }
});

module.exports = router;