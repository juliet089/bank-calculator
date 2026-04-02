#!/usr/bin/env node

/**
 * Скрипт автоматического восстановления веб-приложения "Финансовый калькулятор"
 * 
 * Запуск: node server/scripts/recovery.js
 * 
 * Скрипт выполняет:
 * 1. Проверку подключения к MongoDB
 * 2. Запуск MongoDB если она не запущена
 * 3. Проверку и создание администратора
 * 4. Проверку индексов в БД
 * 5. Проверку и восстановление .env файла
 * 6. Проверку и установку зависимостей
 */

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// Цветной вывод в консоль
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.cyan}ℹ️ ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    step: (msg) => console.log(`\n${colors.blue}📌 ${msg}${colors.reset}`)
};

// Создание интерфейса для ввода
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

// ============================================
// Функции для работы с MongoDB
// ============================================

// Проверка, запущена ли MongoDB
const isMongoDBRunning = async () => {
    return new Promise((resolve) => {
        exec('mongosh --eval "db.runCommand({ping:1})" --quiet', (error) => {
            resolve(!error);
        });
    });
};

// Запуск MongoDB
const startMongoDB = async () => {
    const platform = os.platform();
    
    return new Promise((resolve) => {
        if (platform === 'win32') {
            // Windows
            exec('net start MongoDB', (error, stdout) => {
                if (error) {
                    // Пробуем запустить вручную
                    const mongodPath = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
                    if (fs.existsSync(mongodPath)) {
                        exec(`start /B "${mongodPath}" --dbpath C:\\data\\db`, (err) => {
                            resolve(!err);
                        });
                    } else {
                        resolve(false);
                    }
                } else {
                    resolve(true);
                }
            });
        } else if (platform === 'darwin') {
            // macOS
            exec('brew services start mongodb-community', (error) => {
                resolve(!error);
            });
        } else {
            // Linux
            exec('sudo systemctl start mongod', (error) => {
                resolve(!error);
            });
        }
    });
};

// Проверка и создание администратора
const ensureAdmin = async () => {
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    const dotenv = require('dotenv');
    
    dotenv.config({ path: path.join(__dirname, '../.env') });
    
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bank_calculator');
        
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        
        const admin = await usersCollection.findOne({ username: 'admin' });
        
        if (!admin) {
            log.warning('Администратор не найден. Создание...');
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await usersCollection.insertOne({
                username: 'admin',
                password: hashedPassword,
                role: 'admin',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            log.success('Администратор создан: admin / admin123');
        } else {
            log.success('Администратор существует');
        }
        
        await mongoose.disconnect();
        return true;
        
    } catch (error) {
        log.error(`Ошибка при проверке администратора: ${error.message}`);
        return false;
    }
};

// Проверка и создание индексов
const ensureIndexes = async () => {
    const mongoose = require('mongoose');
    const dotenv = require('dotenv');
    
    dotenv.config({ path: path.join(__dirname, '../.env') });
    
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bank_calculator');
        
        const db = mongoose.connection.db;
        const calculationsCollection = db.collection('calculations');
        
        // Проверка существующих индексов
        const indexes = await calculationsCollection.indexes();
        const indexNames = indexes.map(i => i.name);
        
        // Создание необходимых индексов
        const requiredIndexes = [
            { key: { createdAt: -1 }, name: 'createdAt_-1' },
            { key: { calculatorType: 1 }, name: 'calculatorType_1' },
            { key: { calculatorType: 1, createdAt: -1 }, name: 'calculatorType_1_createdAt_-1' },
            { key: { userEmail: 1 }, name: 'userEmail_1' }
        ];
        
        for (const idx of requiredIndexes) {
            if (!indexNames.includes(idx.name)) {
                await calculationsCollection.createIndex(idx.key, { name: idx.name });
                log.info(`Создан индекс: ${idx.name}`);
            }
        }
        
        log.success('Индексы проверены и созданы');
        await mongoose.disconnect();
        return true;
        
    } catch (error) {
        log.error(`Ошибка при проверке индексов: ${error.message}`);
        return false;
    }
};

// ============================================
// Функции для работы с файлами
// ============================================

// Проверка .env файла
const ensureEnvFile = () => {
    const envPath = path.join(__dirname, '../.env');
    const envExamplePath = path.join(__dirname, '../.env.example');
    
    if (!fs.existsSync(envPath)) {
        log.warning('.env файл не найден');
        
        // Создаем .env с значениями по умолчанию
        const defaultEnv = `PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bank_calculator
JWT_SECRET=${require('crypto').randomBytes(32).toString('hex')}
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password`;
        
        fs.writeFileSync(envPath, defaultEnv);
        log.success('.env файл создан с значениями по умолчанию');
        log.warning('Пожалуйста, отредактируйте .env и добавьте реальные EMAIL_USER и EMAIL_PASS');
        return false;
    } else {
        log.success('.env файл существует');
        return true;
    }
};

// Проверка папки логов
const ensureLogsDirectory = () => {
    const logsPath = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsPath)) {
        fs.mkdirSync(logsPath, { recursive: true });
        log.success('Папка логов создана');
    } else {
        log.success('Папка логов существует');
    }
};

// Проверка папки бэкапов
const ensureBackupDirectory = () => {
    const backupPath = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
        log.success('Папка бэкапов создана');
    } else {
        log.success('Папка бэкапов существует');
    }
};

// ============================================
// Функции для работы с зависимостями
// ============================================

// Проверка и установка зависимостей
const ensureDependencies = async () => {
    const packageJsonPath = path.join(__dirname, '../package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        log.error('package.json не найден');
        return false;
    }
    
    const nodeModulesPath = path.join(__dirname, '../node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
        log.warning('Зависимости не установлены. Установка...');
        
        return new Promise((resolve) => {
            exec('npm install', { cwd: path.join(__dirname, '..') }, (error) => {
                if (error) {
                    log.error('Ошибка установки зависимостей');
                    resolve(false);
                } else {
                    log.success('Зависимости установлены');
                    resolve(true);
                }
            });
        });
    } else {
        log.success('Зависимости установлены');
        return true;
    }
};

// ============================================
// Основная функция восстановления
// ============================================

const runRecovery = async () => {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.cyan}🔄 СКРИПТ АВТОМАТИЧЕСКОГО ВОССТАНОВЛЕНИЯ${colors.reset}`);
    console.log('='.repeat(60) + '\n');
    
    const startTime = Date.now();
    let recoveryLog = {
        timestamp: new Date().toISOString(),
        steps: []
    };
    
    // Шаг 1: Проверка файловой структуры
    log.step('Шаг 1: Проверка файловой структуры');
    ensureLogsDirectory();
    ensureBackupDirectory();
    const envOk = ensureEnvFile();
    recoveryLog.steps.push({ step: 'file_structure', success: true });
    
    // Шаг 2: Проверка и запуск MongoDB
    log.step('Шаг 2: Проверка MongoDB');
    const mongoRunning = await isMongoDBRunning();
    
    if (!mongoRunning) {
        log.warning('MongoDB не запущена. Попытка запуска...');
        const started = await startMongoDB();
        if (started) {
            log.success('MongoDB запущена');
            recoveryLog.steps.push({ step: 'mongodb_started', success: true });
        } else {
            log.error('Не удалось запустить MongoDB');
            log.info('Пожалуйста, запустите MongoDB вручную:');
            log.info('  Windows: net start MongoDB');
            log.info('  Mac: brew services start mongodb-community');
            log.info('  Linux: sudo systemctl start mongod');
            recoveryLog.steps.push({ step: 'mongodb_started', success: false });
        }
    } else {
        log.success('MongoDB уже запущена');
        recoveryLog.steps.push({ step: 'mongodb_running', success: true });
    }
    
    // Шаг 3: Проверка зависимостей
    log.step('Шаг 3: Проверка зависимостей');
    const depsOk = await ensureDependencies();
    recoveryLog.steps.push({ step: 'dependencies', success: depsOk });
    
    // Шаг 4: Проверка администратора (только если MongoDB работает)
    if (await isMongoDBRunning()) {
        log.step('Шаг 4: Проверка администратора');
        const adminOk = await ensureAdmin();
        recoveryLog.steps.push({ step: 'admin', success: adminOk });
    }
    
    // Шаг 5: Проверка индексов (только если MongoDB работает)
    if (await isMongoDBRunning()) {
        log.step('Шаг 5: Проверка индексов');
        const indexesOk = await ensureIndexes();
        recoveryLog.steps.push({ step: 'indexes', success: indexesOk });
    }
    
    // Итоги восстановления
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.cyan}📊 ИТОГИ ВОССТАНОВЛЕНИЯ${colors.reset}`);
    console.log('='.repeat(60));
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ Время выполнения: ${duration} сек.`);
    
    const allSuccess = recoveryLog.steps.every(s => s.success);
    
    if (allSuccess) {
        console.log(`\n${colors.green}✅ ВОССТАНОВЛЕНИЕ УСПЕШНО ЗАВЕРШЕНО${colors.reset}`);
        
        console.log(`\n${colors.cyan}🌐 Для запуска приложения выполните:${colors.reset}`);
        console.log('   cd server && npm run dev');
        console.log('   cd client && npm start');
        
        console.log(`\n${colors.cyan}🔐 Данные для входа в админ-панель:${colors.reset}`);
        console.log('   Логин: admin');
        console.log('   Пароль: admin123');
        
    } else {
        console.log(`\n${colors.red}⚠️ ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО С ОШИБКАМИ${colors.reset}`);
        console.log(`\n${colors.yellow}Проблемные шаги:${colors.reset}`);
        recoveryLog.steps.filter(s => !s.success).forEach(s => {
            console.log(`   - ${s.step}`);
        });
    }
    
    // Сохранение лога восстановления
    const logPath = path.join(__dirname, '../logs', `recovery_${new Date().toISOString().split('T')[0]}.log`);
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify(recoveryLog, null, 2));
    console.log(`\n📝 Лог восстановления сохранен: ${logPath}`);
    
    rl.close();
};

// ============================================
// Запуск скрипта
// ============================================

// Проверка прав администратора (для Windows)
if (os.platform() === 'win32') {
    const isAdmin = (() => {
        try {
            execSync('net session', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    })();
    
    if (!isAdmin) {
        log.warning('Скрипт запущен без прав администратора');
        log.info('Некоторые функции (запуск MongoDB) могут не работать');
        log.info('Рекомендуется запустить PowerShell от имени администратора\n');
    }
}

runRecovery().catch(console.error);