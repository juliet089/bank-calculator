const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Calculator = require('../models/Calculator');
const Calculation = require('../models/Calculation');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// ==================== ПУБЛИЧНЫЙ МАРШРУТ ====================
// Логин администратора
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('🔐 Попытка входа:', username);
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Имя пользователя и пароль обязательны' 
            });
        }
        
        const user = await User.findOne({ username });
        
        if (!user) {
            console.log('❌ Пользователь не найден:', username);
            return res.status(401).json({ 
                success: false,
                message: 'Неверное имя пользователя или пароль' 
            });
        }
        
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            console.log('❌ Неверный пароль для:', username);
            return res.status(401).json({ 
                success: false,
                message: 'Неверное имя пользователя или пароль' 
            });
        }
        
        const token = jwt.sign(
            { 
                userId: user._id, 
                role: user.role,
                username: user.username 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('✅ Успешный вход:', username);
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка сервера при входе' 
        });
    }
});

// ==================== ЗАЩИЩЕННЫЕ МАРШРУТЫ ====================
router.use(authMiddleware, adminMiddleware);

// ==================== УПРАВЛЕНИЕ КАЛЬКУЛЯТОРАМИ ====================

// Получить все калькуляторы
router.get('/calculators', async (req, res) => {
    try {
        const calculators = await Calculator.find().sort('order');
        res.json(calculators);
    } catch (error) {
        console.error('Ошибка получения калькуляторов:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка получения списка калькуляторов' 
        });
    }
});

// Получить один калькулятор по ID
router.get('/calculators/:id', async (req, res) => {
    try {
        const calculator = await Calculator.findById(req.params.id);
        if (!calculator) {
            return res.status(404).json({ 
                success: false,
                message: 'Калькулятор не найден' 
            });
        }
        res.json(calculator);
    } catch (error) {
        console.error('Ошибка получения калькулятора:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка получения калькулятора' 
        });
    }
});

// Создать новый калькулятор
router.post('/calculators', async (req, res) => {
    try {
        const { name, title, defaultRate, description, fields, isActive, order } = req.body;
        
        if (!name || !title || defaultRate === undefined) {
            return res.status(400).json({ 
                success: false,
                message: 'Название, заголовок и процентная ставка обязательны' 
            });
        }
        
        const existingCalculator = await Calculator.findOne({ name });
        if (existingCalculator) {
            return res.status(400).json({ 
                success: false,
                message: 'Калькулятор с таким именем уже существует' 
            });
        }
        
        const calculator = new Calculator({
            name,
            title,
            defaultRate,
            description: description || '',
            fields: fields || [],
            isActive: isActive !== undefined ? isActive : true,
            order: order || 0
        });
        
        await calculator.save();
        console.log('✅ Создан калькулятор:', name);
        
        res.status(201).json({ success: true, calculator });
        
    } catch (error) {
        console.error('Ошибка создания калькулятора:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка создания калькулятора: ' + error.message 
        });
    }
});

// Обновить калькулятор
router.put('/calculators/:id', async (req, res) => {
    try {
        const calculator = await Calculator.findById(req.params.id);
        if (!calculator) {
            return res.status(404).json({ 
                success: false,
                message: 'Калькулятор не найден' 
            });
        }
        
        const { name, title, defaultRate, description, fields, isActive, order } = req.body;
        
        if (name && name !== calculator.name) {
            const existingCalculator = await Calculator.findOne({ name });
            if (existingCalculator) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Калькулятор с таким именем уже существует' 
                });
            }
        }
        
        if (name) calculator.name = name;
        if (title) calculator.title = title;
        if (defaultRate !== undefined) calculator.defaultRate = defaultRate;
        if (description !== undefined) calculator.description = description;
        if (fields) calculator.fields = fields;
        if (isActive !== undefined) calculator.isActive = isActive;
        if (order !== undefined) calculator.order = order;
        
        await calculator.save();
        console.log('✅ Обновлен калькулятор:', calculator.name);
        
        res.json({ success: true, calculator });
        
    } catch (error) {
        console.error('Ошибка обновления калькулятора:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка обновления калькулятора: ' + error.message 
        });
    }
});

// Удалить калькулятор
router.delete('/calculators/:id', async (req, res) => {
    try {
        const calculator = await Calculator.findByIdAndDelete(req.params.id);
        if (!calculator) {
            return res.status(404).json({ 
                success: false,
                message: 'Калькулятор не найден' 
            });
        }
        console.log('✅ Удален калькулятор:', calculator.name);
        res.json({ success: true, message: 'Калькулятор успешно удален' });
        
    } catch (error) {
        console.error('Ошибка удаления калькулятора:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка удаления калькулятора' 
        });
    }
});

// ==================== УПРАВЛЕНИЕ РАСЧЕТАМИ ====================

// Получить все расчеты пользователей
router.get('/calculations', async (req, res) => {
    try {
        const { page = 1, limit = 50, type, startDate, endDate, email } = req.query;
        
        let query = {};
        if (type) query.calculatorType = type;
        if (email) query.userEmail = { $regex: email, $options: 'i' };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const calculations = await Calculation.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);
        
        const total = await Calculation.countDocuments(query);
        
        res.json({
            success: true,
            calculations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Ошибка получения расчетов:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка получения списка расчетов' 
        });
    }
});

// Получить статистику по расчетам
router.get('/calculations/stats', async (req, res) => {
    try {
        const totalCalculations = await Calculation.countDocuments();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCalculations = await Calculation.countDocuments({
            createdAt: { $gte: today }
        });
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekCalculations = await Calculation.countDocuments({
            createdAt: { $gte: weekAgo }
        });
        
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthCalculations = await Calculation.countDocuments({
            createdAt: { $gte: monthAgo }
        });
        
        const byType = await Calculation.aggregate([
            {
                $group: {
                    _id: '$calculatorType',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        res.json({
            success: true,
            stats: {
                total: totalCalculations,
                today: todayCalculations,
                week: weekCalculations,
                month: monthCalculations,
                byType: byType,
                daily: [],
                avgMonthlyPayment: 0,
                topUsers: []
            }
        });
        
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка получения статистики' 
        });
    }
});

// Экспорт расчетов в CSV (ИСПРАВЛЕННАЯ ВЕРСИЯ)
router.get('/calculations/export', async (req, res) => {
    try {
        console.log('📊 Начало экспорта расчетов...');
        
        const calculations = await Calculation.find({}).sort({ createdAt: -1 });
        
        if (!calculations || calculations.length === 0) {
            console.log('⚠️ Нет данных для экспорта');
            return res.status(404).json({ 
                success: false, 
                message: 'Нет данных для экспорта' 
            });
        }
        
        console.log(`📊 Найдено ${calculations.length} расчетов для экспорта`);
        
        // Формируем заголовки CSV
        const headers = [
            'ID', 'Тип', 'Дата', 'Email', 'IP адрес',
            'Сумма', 'Срок (лет)', 'Ежемесячный платеж', 
            'Общая сумма', 'Переплата/Доход', 'Необходимый доход'
        ];
        
        // Формируем строки
        const rows = calculations.map(calc => {
            const safeInput = calc.inputData || {};
            const safeResult = calc.resultData || {};
            
            let amount = '—';
            let term = safeInput.years || '—';
            let monthlyPayment = '—';
            let totalPayment = '—';
            let extra = '—';
            let requiredIncome = '—';
            
            switch (calc.calculatorType) {
                case 'mortgage':
                    amount = safeInput.propertyPrice || '—';
                    monthlyPayment = safeResult.monthlyPayment || '—';
                    totalPayment = safeResult.totalPayment || '—';
                    extra = safeResult.overpayment || '—';
                    requiredIncome = safeResult.requiredIncome || '—';
                    break;
                case 'autocredit':
                    amount = safeInput.carPrice || '—';
                    monthlyPayment = safeResult.monthlyPayment || '—';
                    totalPayment = safeResult.totalPayment || '—';
                    extra = safeResult.overpayment || '—';
                    requiredIncome = safeResult.requiredIncome || '—';
                    break;
                case 'consumer':
                    amount = safeInput.amount || '—';
                    monthlyPayment = safeResult.monthlyPayment || '—';
                    totalPayment = safeResult.totalPayment || '—';
                    extra = safeResult.overpayment || '—';
                    requiredIncome = safeResult.requiredIncome || '—';
                    break;
                case 'pension':
                    amount = safeInput.currentSavings || '—';
                    monthlyPayment = '—';
                    totalPayment = safeResult.totalSavings || safeResult.totalPayment || '—';
                    extra = safeResult.profit || safeResult.overpayment || '—';
                    requiredIncome = '—';
                    break;
                default:
                    amount = safeInput.amount || safeInput.propertyPrice || safeInput.carPrice || safeInput.currentSavings || '—';
                    monthlyPayment = safeResult.monthlyPayment || '—';
                    totalPayment = safeResult.totalPayment || safeResult.totalSavings || '—';
                    extra = safeResult.overpayment || safeResult.profit || '—';
                    requiredIncome = safeResult.requiredIncome || '—';
            }
            
            return [
                calc._id.toString(),
                calc.calculatorType,
                calc.createdAt ? new Date(calc.createdAt).toLocaleString('ru-RU') : '—',
                calc.userEmail || '—',
                calc.userIp || '—',
                amount,
                term,
                monthlyPayment,
                totalPayment,
                extra,
                requiredIncome
            ];
        });
        
        // Создаем CSV строку
        const csvLines = [];
        csvLines.push(headers.join(','));
        
        for (const row of rows) {
            const escapedRow = row.map(cell => {
                const str = String(cell);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',');
            csvLines.push(escapedRow);
        }
        
        const csvContent = csvLines.join('\n');
        const bom = '\uFEFF';
        const fileName = `calculations_${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Cache-Control', 'no-cache');
        
        res.send(bom + csvContent);
        
        console.log(`✅ Экспортировано ${calculations.length} расчетов в CSV`);
        
    } catch (error) {
        console.error('❌ Ошибка экспорта CSV:', error);
        console.error('Стек ошибки:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка экспорта данных: ' + error.message 
        });
    }
});

// Удалить расчет по ID
router.delete('/calculations/:id', async (req, res) => {
    try {
        const calculation = await Calculation.findByIdAndDelete(req.params.id);
        if (!calculation) {
            return res.status(404).json({ 
                success: false,
                message: 'Расчет не найден' 
            });
        }
        console.log('✅ Удален расчет:', calculation._id);
        res.json({ success: true, message: 'Расчет успешно удален' });
        
    } catch (error) {
        console.error('Ошибка удаления расчета:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка удаления расчета' 
        });
    }
});

// Проверка статуса аутентификации
router.get('/verify', async (req, res) => {
    try {
        const user = await User.findById(req.userId, '-password');
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Пользователь не найден' 
            });
        }
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Ошибка проверки аутентификации:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка проверки аутентификации' 
        });
    }
});

module.exports = router;