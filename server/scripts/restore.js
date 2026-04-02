const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '../../backups');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function restoreBackup() {
    console.log('========================================');
    console.log('   Восстановление из бэкапа');
    console.log('========================================\n');
    
    // Поиск доступных бэкапов
    if (!fs.existsSync(BACKUP_DIR)) {
        console.log('❌ Папка с бэкапами не найдена');
        process.exit(1);
    }
    
    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup_'))
        .sort()
        .reverse();
    
    if (backups.length === 0) {
        console.log('❌ Нет доступных бэкапов');
        process.exit(1);
    }
    
    console.log('📋 Доступные бэкапы:\n');
    backups.forEach((backup, index) => {
        const backupPath = path.join(BACKUP_DIR, backup);
        const infoPath = path.join(backupPath, 'backup_info.json');
        let date = backup.replace('backup_', '');
        
        if (fs.existsSync(infoPath)) {
            const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
            date = info.backupDate;
        }
        
        console.log(`   ${index + 1}. ${backup} (${date})`);
    });
    
    const answer = await question('\n🔢 Выберите номер бэкапа для восстановления: ');
    const selectedIndex = parseInt(answer) - 1;
    
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= backups.length) {
        console.log('❌ Неверный выбор');
        process.exit(1);
    }
    
    const selectedBackup = backups[selectedIndex];
    const backupPath = path.join(BACKUP_DIR, selectedBackup);
    
    console.log(`\n⚠️ ВНИМАНИЕ! Восстановление из бэкапа "${selectedBackup}"`);
    console.log('   Это перезапишет текущие данные в базе данных!');
    
    const confirm = await question('\n💀 Введите "ВОССТАНОВИТЬ" для подтверждения: ');
    
    if (confirm !== 'ВОССТАНОВИТЬ') {
        console.log('❌ Операция отменена');
        process.exit(0);
    }
    
    let client;
    
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
        console.log(`\n🔌 Подключение к MongoDB...`);
        
        client = new MongoClient(uri);
        await client.connect();
        
        const db = client.db('bank_calculator');
        
        // Получение списка файлов в бэкапе
        const files = fs.readdirSync(backupPath).filter(f => f.endsWith('.json') && f !== 'backup_info.json');
        
        console.log(`📊 Найдено файлов для восстановления: ${files.length}\n`);
        
        for (const file of files) {
            const collectionName = file.replace('.json', '');
            console.log(`   Восстановление коллекции: ${collectionName}...`);
            
            const filePath = path.join(backupPath, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (data.length > 0) {
                // Очищаем коллекцию перед восстановлением
                await db.collection(collectionName).deleteMany({});
                // Вставляем данные
                await db.collection(collectionName).insertMany(data);
                console.log(`      ✅ Восстановлено ${data.length} документов`);
            }
        }
        
        console.log('\n========================================');
        console.log('✅ Восстановление из бэкапа завершено!');
        console.log(`📁 Использован бэкап: ${selectedBackup}`);
        console.log('========================================');
        
    } catch (error) {
        console.error('❌ Ошибка при восстановлении:', error.message);
    } finally {
        if (client) await client.close();
        rl.close();
    }
}

restoreBackup();