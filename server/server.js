const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();

// ============================================
// НАСТРОЙКА ЛОГИРОВАНИЯ
// ============================================

// Создание папки для логов если её нет
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('📁 Создана папка для логов:', logsDir);
}

// Функция для записи в лог-файл
const writeToLog = (filename, data) => {
    const logFilePath = path.join(logsDir, filename);
    fs.appendFileSync(logFilePath, data + '\n');
};

// Функция для форматирования даты
const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
};

const getCurrentDateTime = () => {
    return new Date().toISOString();
};

// ============================================
// MIDDLEWARE ДЛЯ ЗАМЕРА ВРЕМЕНИ ОТВЕТА API
// ============================================
app.use((req, res, next) => {
    const start = Date.now();
    const startTime = getCurrentDateTime();
    
    // Сохраняем информацию о запросе
    const requestInfo = {
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
        userAgent: req.get('user-agent') || 'unknown',
        startTime: startTime
    };
    
    // Логируем начало запроса
    console.log(`📥 ${req.method} ${req.url} - начат в ${startTime}`);
    
    // Перехватываем событие окончания ответа
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logEntry = {
            ...requestInfo,
            duration: duration,
            statusCode: res.statusCode,
            endTime: getCurrentDateTime(),
            isSlow: duration > 1000,
            contentLength: res.get('content-length') || 0
        };
        
        // Вывод в консоль с цветовой индикацией
        if (duration > 1000) {
            console.log(`\x1b[31m⚠️ МЕДЛЕННЫЙ ЗАПРОС: ${req.method} ${req.url} - ${duration}ms (статус: ${res.statusCode})\x1b[0m`);
        } else if (duration > 500) {
            console.log(`\x1b[33m⚡ Предупреждение: ${req.method} ${req.url} - ${duration}ms (статус: ${res.statusCode})\x1b[0m`);
        } else {
            console.log(`\x1b[32m✅ ${req.method} ${req.url} - ${duration}ms (статус: ${res.statusCode})\x1b[0m`);
        }
        
        // Запись в файл логов (только медленные запросы)
        if (duration > 1000) {
            const slowLogFile = `slow-requests-${getCurrentDate()}.log`;
            writeToLog(slowLogFile, JSON.stringify(logEntry));
        }
        
        // Запись всех запросов в отдельный файл (для аналитики)
        const allLogsFile = `all-requests-${getCurrentDate()}.log`;
        writeToLog(allLogsFile, JSON.stringify(logEntry));
        
        // Отдельный лог для ошибок
        if (res.statusCode >= 400) {
            const errorLogFile = `errors-${getCurrentDate()}.log`;
            writeToLog(errorLogFile, JSON.stringify(logEntry));
        }
    });
    
    next();
});

// ============================================
// СТАНДАРТНЫЕ MIDDLEWARE
// ============================================
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ПОДКЛЮЧЕНИЕ К MONGODB С ПОВТОРНЫМИ ПОПЫТКАМИ
// ============================================
let retryCount = 0;
const maxRetries = 5;

const connectWithRetry = () => {
    console.log(`🔄 Попытка подключения к MongoDB (${retryCount + 1}/${maxRetries})...`);
    console.log(`📡 URI: ${process.env.MONGODB_URI}`);
    
    mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB подключена успешно');
        console.log(`📊 База данных: ${mongoose.connection.name}`);
        console.log(`📍 Хост: ${mongoose.connection.host}`);
        console.log(`🔢 Порт: ${mongoose.connection.port}`);
        retryCount = 0; // Сброс счетчика при успешном подключении
        
        // Логирование успешного подключения
        const logEntry = {
            event: 'mongodb_connected',
            timestamp: getCurrentDateTime(),
            host: mongoose.connection.host,
            database: mongoose.connection.name
        };
        writeToLog(`connection-${getCurrentDate()}.log`, JSON.stringify(logEntry));
    })
    .catch((err) => {
        console.error('❌ Ошибка подключения к MongoDB:', err.message);
        
        // Логирование ошибки подключения
        const logEntry = {
            event: 'mongodb_connection_error',
            timestamp: getCurrentDateTime(),
            error: err.message,
            retryCount: retryCount + 1
        };
        writeToLog(`errors-${getCurrentDate()}.log`, JSON.stringify(logEntry));
        
        if (retryCount < maxRetries) {
            retryCount++;
            const delay = 5000 * retryCount;
            console.log(`⏳ Повторная попытка через ${delay/1000} секунд...`);
            setTimeout(connectWithRetry, delay);
        } else {
            console.error('❌ Не удалось подключиться к MongoDB после нескольких попыток');
            console.log('\n💡 Проверьте:');
            console.log('1. Запущена ли MongoDB?');
            console.log('2. Правильный ли URI в .env?');
            console.log('3. Не занят ли порт 27017?');
        }
    });
};

// Обработка событий подключения
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
    const logEntry = {
        event: 'mongodb_error',
        timestamp: getCurrentDateTime(),
        error: err.message
    };
    writeToLog(`errors-${getCurrentDate()}.log`, JSON.stringify(logEntry));
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 MongoDB отключена');
    const logEntry = {
        event: 'mongodb_disconnected',
        timestamp: getCurrentDateTime()
    };
    writeToLog(`connection-${getCurrentDate()}.log`, JSON.stringify(logEntry));
});

mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB переподключена');
    const logEntry = {
        event: 'mongodb_reconnected',
        timestamp: getCurrentDateTime()
    };
    writeToLog(`connection-${getCurrentDate()}.log`, JSON.stringify(logEntry));
});

// Запускаем подключение
connectWithRetry();

// ============================================
// МАРШРУТЫ API
// ============================================

// Базовый маршрут для проверки
app.get('/', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
        message: 'Сервер финансового калькулятора работает',
        status: 'OK',
        mongodb: dbStatus,
        timestamp: getCurrentDateTime(),
        uptime: process.uptime()
    });
});

// Маршрут для проверки здоровья приложения (для мониторинга)
app.get('/health', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const checks = {
        status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
        timestamp: getCurrentDateTime(),
        mongodb: dbStatus,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
    };
    
    const allOk = dbStatus === 'connected';
    res.status(allOk ? 200 : 503).json(checks);
});

// Маршрут для получения информации о системе
app.get('/info', (req, res) => {
    res.json({
        name: 'Финансовый калькулятор',
        version: '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        mongodb: {
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            host: mongoose.connection.host,
            database: mongoose.connection.name
        }
    });
});

// Основные маршруты API
app.use('/api/calculators', require('./routes/calculatorRoutes'));
app.use('/api/calculate', require('./routes/calculationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ============================================
// ОБРАБОТЧИК 404 (НЕ НАЙДЕНО)
// ============================================
app.use((req, res) => {
    console.log(`❌ 404: ${req.method} ${req.url} - маршрут не найден`);
    res.status(404).json({ 
        message: 'Маршрут не найден',
        path: req.url,
        method: req.method
    });
});

// ============================================
// ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Ошибка сервера:', err);
    
    // Логирование ошибки
    const logEntry = {
        event: 'server_error',
        timestamp: getCurrentDateTime(),
        method: req.method,
        url: req.url,
        error: err.message,
        stack: err.stack,
        ip: req.ip
    };
    writeToLog(`errors-${getCurrentDate()}.log`, JSON.stringify(logEntry));
    
    res.status(500).json({ 
        message: 'Внутренняя ошибка сервера',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Произошла ошибка на сервере'
    });
});

// ============================================
// ОБРАБОТКА НЕОБРАБОТАННЫХ ИСКЛЮЧЕНИЙ
// ============================================
process.on('uncaughtException', (error) => {
    console.error('❌ Непойманное исключение:', error);
    const logEntry = {
        event: 'uncaught_exception',
        timestamp: getCurrentDateTime(),
        error: error.message,
        stack: error.stack
    };
    writeToLog(`critical-${getCurrentDate()}.log`, JSON.stringify(logEntry));
    
    // Даем время для записи лога перед выходом
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Необработанный rejection:', reason);
    const logEntry = {
        event: 'unhandled_rejection',
        timestamp: getCurrentDateTime(),
        reason: reason?.message || String(reason),
        stack: reason?.stack
    };
    writeToLog(`critical-${getCurrentDate()}.log`, JSON.stringify(logEntry));
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('🚀 Сервер финансового калькулятора запущен');
    console.log('========================================');
    console.log(`📱 Адрес: http://localhost:${PORT}`);
    console.log(`🔧 Состояние MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Подключена' : '❌ Не подключена'}`);
    console.log(`📁 Логи сохраняются в: ${logsDir}`);
    console.log('========================================\n');
    
    // Логирование успешного запуска
    const logEntry = {
        event: 'server_started',
        timestamp: getCurrentDateTime(),
        port: PORT,
        pid: process.pid
    };
    writeToLog(`server-${getCurrentDate()}.log`, JSON.stringify(logEntry));
});

// ============================================
// КОРРЕКТНОЕ ЗАВЕРШЕНИЕ РАБОТЫ
// ============================================
const gracefulShutdown = () => {
    console.log('\n🛑 Получен сигнал завершения. Закрытие сервера...');
    
    server.close(async () => {
        console.log('📡 HTTP сервер закрыт');
        
        // Закрытие подключения к MongoDB
        await mongoose.connection.close();
        console.log('🔌 MongoDB подключение закрыто');
        
        // Логирование завершения
        const logEntry = {
            event: 'server_shutdown',
            timestamp: getCurrentDateTime()
        };
        writeToLog(`server-${getCurrentDate()}.log`, JSON.stringify(logEntry));
        
        console.log('👋 Сервер успешно завершил работу');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);