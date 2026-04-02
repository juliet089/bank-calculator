const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// Настройки
const DB_NAME = 'bank_calculator';
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Функция для поиска mongodump
async function findMongodump() {
    const possiblePaths = [
        'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongodump.exe',
        'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongodump.exe',
        'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongodump.exe',
        'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongodump.exe',
        '/usr/bin/mongodump',
        '/usr/local/bin/mongodump'
    ];
    
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    
    // Попытка найти через which
    try {
        const { stdout } = await execPromise('where mongodump 2>nul || which mongodump');
        const path = stdout.trim();
        if (path && fs.existsSync(path)) {
            return path;
        }
    } catch (e) {
        // Не найден
    }
    
    return null;
}

// Функция для создания бэкапа
async function createBackup() {
    console.log('========================================');
    console.log('   Создание бэкапа MongoDB');
    console.log('========================================\n');
    
    // Создание папки для бэкапов
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`📁 Создана папка: ${BACKUP_DIR}`);
    }
    
    // Поиск mongodump
    const mongodumpPath = await findMongodump();
    if (!mongodumpPath) {
        console.error('❌ mongodump не найден!');
        console.log('\n💡 Установите MongoDB или добавьте путь к mongodump в переменную PATH');
        console.log('   Обычно mongodump находится в: C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\');
        process.exit(1);
    }
    
    console.log(`🔧 Используется: ${mongodumpPath}`);
    
    // Формирование имени бэкапа
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 19).replace(/:/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup_${dateStr}`);
    
    console.log(`📊 База данных: ${DB_NAME}`);
    console.log(`📁 Папка бэкапа: ${backupPath}`);
    console.log('\n🔄 Создание бэкапа...\n');
    
    try {
        // Выполнение бэкапа
        await execPromise(`"${mongodumpPath}" --db ${DB_NAME} --out "${backupPath}"`);
        
        console.log('✅ Бэкап успешно создан!');
        console.log(`📁 Расположение: ${backupPath}`);
        
        // Получение размера бэкапа
        const getSize = (dirPath) => {
            let size = 0;
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    size += getSize(filePath);
                } else {
                    size += stats.size;
                }
            }
            return size;
        };
        
        const sizeInMB = getSize(backupPath) / (1024 * 1024);
        console.log(`📊 Размер бэкапа: ${sizeInMB.toFixed(2)} MB`);
        
        // Автоматическое удаление старых бэкапов (оставляем последние 10)
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('backup_'))
            .map(f => ({
                name: f,
                path: path.join(BACKUP_DIR, f),
                time: fs.statSync(path.join(BACKUP_DIR, f)).mtime
            }))
            .sort((a, b) => b.time - a.time);
        
        if (backups.length > 10) {
            console.log('\n🗑️ Удаление старых бэкапов...');
            const toDelete = backups.slice(10);
            for (const backup of toDelete) {
                fs.rmSync(backup.path, { recursive: true, force: true });
                console.log(`   Удален: ${backup.name}`);
            }
        }
        
        console.log('\n========================================');
        console.log('   Бэкап завершен успешно!');
        console.log('========================================');
        
    } catch (error) {
        console.error('❌ Ошибка при создании бэкапа:', error.message);
        process.exit(1);
    }
}

// Запуск
createBackup();