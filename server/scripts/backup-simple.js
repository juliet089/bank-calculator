const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '../../backups');

async function createBackup() {
    console.log('========================================');
    console.log('   Создание бэкапа MongoDB (через Node.js)');
    console.log('========================================\n');
    
    // Создание папки для бэкапов
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`📁 Создана папка: ${BACKUP_DIR}`);
    }
    
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 19).replace(/:/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup_${dateStr}`);
    
    // Создаем папку для бэкапа
    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
    }
    
    let client;
    
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
        console.log(`🔌 Подключение к MongoDB...`);
        
        client = new MongoClient(uri);
        await client.connect();
        
        const db = client.db('bank_calculator');
        
        // Получение списка коллекций
        const collections = await db.listCollections().toArray();
        console.log(`📊 Найдено коллекций: ${collections.length}`);
        
        // Экспорт каждой коллекции
        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`   Экспорт коллекции: ${collectionName}...`);
            
            const data = await db.collection(collectionName).find({}).toArray();
            const filePath = path.join(backupPath, `${collectionName}.json`);
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`      ✅ Экспортировано ${data.length} документов`);
        }
        
        // Создание информационного файла
        const info = {
            backupDate: new Date().toISOString(),
            databaseName: 'bank_calculator',
            collections: collections.map(c => c.name),
            totalCollections: collections.length,
            mongodbVersion: client.topology?.description?.server?.description?.version || 'unknown'
        };
        
        fs.writeFileSync(path.join(backupPath, 'backup_info.json'), JSON.stringify(info, null, 2));
        
        // Подсчет общего размера
        let totalSize = 0;
        const files = fs.readdirSync(backupPath);
        for (const file of files) {
            const stats = fs.statSync(path.join(backupPath, file));
            totalSize += stats.size;
        }
        
        const sizeInMB = totalSize / (1024 * 1024);
        
        console.log('\n========================================');
        console.log('✅ Бэкап успешно создан!');
        console.log(`📁 Расположение: ${backupPath}`);
        console.log(`📊 Размер: ${sizeInMB.toFixed(2)} MB`);
        console.log('========================================');
        
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
        
    } catch (error) {
        console.error('❌ Ошибка при создании бэкапа:', error.message);
    } finally {
        if (client) await client.close();
    }
}

createBackup();