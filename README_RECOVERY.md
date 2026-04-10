# Инструкция по восстановлению веб-приложения "Финансовый калькулятор"

**Версия:** 1.0.0  
**Дата последнего обновления:** 30 марта 2026 г.  
**Автор:** Краснюкова Елена Алексеевна

---

## 📋 Содержание

1. [Введение](#введение)
2. [Диагностика проблем](#диагностика-проблем)
3. [Восстановление MongoDB](#восстановление-mongodb)
4. [Восстановление сервера](#восстановление-сервера)
5. [Восстановление клиента](#восстановление-клиента)
6. [Восстановление данных из бэкапа](#восстановление-данных-из-бэкапа)
7. [Восстановление администратора](#восстановление-администратора)
8. [Восстановление email настроек](#восстановление-email-настроек)
9. [Скрипт автоматического восстановления](#скрипт-автоматического-восстановления)
10. [Частые проблемы и решения](#частые-проблемы-и-решения)
11. [Чек-лист восстановления](#чек-лист-восстановления)
12. [Контакты поддержки](#контакты-поддержки)
13. [Быстрое восстановление](#быстрое-восстановление)

---

## 📖 Введение

Данная инструкция предназначена для администратора системы и описывает процедуры диагностики, восстановления и устранения неполадок веб-приложения "Финансовый калькулятор".

### Структура проекта
D:\bank-calculator
├── client\ # React фронтенд
├── server\ # Node.js бэкенд
├── backups\ # Резервные копии
├── logs\ # Логи приложения
├── README.md # Основная документация
└── README_RECOVERY.md # Инструкция по восстановлению

### Необходимые права
- Администратор Windows для запуска/остановки служб
- Доступ к файловой системе проекта
- Доступ к MongoDB

---

## 🔍 Диагностика проблем

### 1.1 Быстрая диагностика (30 секунд)

# Проверка статуса всех сервисов
curl http://localhost:5000/health
curl http://localhost:3000
mongosh --eval "db.runCommand({ping:1})"

### 1.2 Полная диагностика

# 1. Проверка MongoDB
mongosh --eval "db.runCommand({ping:1})"
if %errorlevel% neq 0 echo ❌ MongoDB не отвечает

# 2. Проверка портов
netstat -ano | findstr :5000
netstat -ano | findstr :3000
netstat -ano | findstr :27017

# 3. Проверка сервера
curl http://localhost:5000
curl http://localhost:5000/api/calculators

# 4. Проверка клиента
curl http://localhost:3000

# 5. Просмотр последних ошибок
powershell "Get-Content server\logs\errors-*.log -Tail 20"

# 6. Просмотр медленных запросов
powershell "Get-Content server\logs\slow-requests-*.log -Tail 10"

### 1.3 Диагностика через браузер
Откройте Инструменты разработчика (F12)
Перейдите на вкладку Console - проверьте наличие ошибок
Перейдите на вкладку Network - проверьте статус запросов
Перейдите на вкладку Application → Local Storage - проверьте наличие токена



## 🗄️ Восстановление MongoDB

### 2.1 MongoDB не запущена

Симптомы:

Ошибка: connect ECONNREFUSED 127.0.0.1:27017
Сервер пишет: MongoDB подключена: false

Решение:

# Вариант 1: Запуск как службы Windows (администратор)
net start MongoDB

# Проверка статуса
sc query MongoDB

# Вариант 2: Ручной запуск (если не установлена как служба)
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath C:\data\db

# Вариант 3: Если MongoDB не установлена скачать с
# https://www.mongodb.com/try/download/community

### 2.2 Повреждение базы данных

Симптомы:

Ошибка: WiredTiger error
Невозможно подключиться к коллекциям

Решение:

# 1. Остановите MongoDB
net stop MongoDB

# 2. Создайте резервную копию
xcopy "C:\data\db" "C:\data\db_backup_%date:~0,4%%date:~5,2%%date:~8,2%" /E /I

# 3. Удалите lock-файлы
del "C:\data\db\*.lock"

# 4. Запустите восстановление
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --repair --dbpath C:\data\db

# 5. Запустите MongoDB
net start MongoDB

### 2.3 Восстановление из бэкапа MongoDB

# 1. Остановите приложение (чтобы не было новых записей)

# 2. Восстановите базу данных
mongorestore --db bank_calculator --drop D:\bank-calculator\backups\latest\

# 3. Перезапустите сервер
cd D:\bank-calculator\server
npm run dev

### 2.4 Создание нового экземпляра MongoDB

# 1. Установите MongoDB Community Edition

# 2. Создайте папку для данных
mkdir C:\data\db

# 3. Запустите MongoDB
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath C:\data\db

# 4. Создайте базу данных
mongosh
use bank_calculator

# 5. Создайте администратора (см. раздел 7)



## 🖥️ Восстановление сервера

### 3.1 Сервер не запускается

Симптомы:

Ошибка: Cannot find module
Ошибка: Port already in use
Ошибка: JWT_SECRET is not defined

Решение:

cd D:\bank-calculator\server

# 1. Проверка наличия .env файла
if not exist .env (
    copy .env.example .env
    echo ❗ Отредактируйте .env файл
)

# 2. Установка зависимостей
npm install

# 3. Переустановка (если нужно)
rm -rf node_modules package-lock.json
npm install

# 4. Запуск сервера
npm run dev

### 3.2 Порт 5000 занят

Решение:

# 1. Найти процесс, использующий порт 5000
netstat -ano | findstr :5000

# 2. Завершить процесс (замените PID на реальный)
taskkill /PID 12345 /F

# 3. Или изменить порт в .env
echo PORT=5001 >> .env

# 4. Обновить proxy в client/package.json
# "proxy": "http://localhost:5001"

### 3.3 Ошибка JWT_SECRET

Решение:

# Добавьте в файл .env
echo JWT_SECRET=my_super_secret_key_$(date +%s) >> .env

# Или сгенерируйте случайный ключ
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" >> .env

### 3.4 Полное восстановление сервера

# 1. Остановка всех процессов
taskkill /F /IM node.exe 2>nul

# 2. Очистка кэша npm
npm cache clean --force

# 3. Удаление и переустановка
cd D:\bank-calculator\server
rm -rf node_modules package-lock.json
npm install

# 4. Создание .env (если отсутствует)
if not exist .env (
    echo PORT=5000 > .env
    echo MONGODB_URI=mongodb://127.0.0.1:27017/bank_calculator >> .env
    echo JWT_SECRET=my_secret_key_$(date +%s) >> .env
)

# 5. Запуск
npm run dev



## 🎨 Восстановление клиента

### 4.1 Клиент не запускается

Симптомы:

Ошибка: Module not found
Ошибка: react-scripts not found

Решение:

cd D:\bank-calculator\client

# 1. Установка зависимостей
npm install

# 2. Переустановка (если нужно)
rm -rf node_modules package-lock.json
npm install

# 3. Запуск клиента
npm start

### 4.2 Ошибка сборки (build)

Решение:

# 1. Очистка кэша
npm cache clean --force

# 2. Удаление папки build
rm -rf build

# 3. Пересборка
npm run build

# 4. Запуск
npx serve -s build

### 4.3 Порт 3000 занят

Решение:

# 1. Найти процесс
netstat -ano | findstr :3000

# 2. Завершить процесс
taskkill /PID [PID] /F

# 3. Запустить на другом порту
set PORT=3001 && npm start



## 💾 Восстановление данных из бэкапа

# Создание бэкапа с помощью встроенного mongosh для экспорта (без mongodump)
npm run backup

### 5.1 Просмотр доступных бэкапов

# Список всех бэкапов
dir D:\bank-calculator\backups\ /od

# Информация о последнем бэкапе
type D:\bank-calculator\backups\backup_*\backup_info.json

# Размер бэкапов
powershell "Get-ChildItem D:\bank-calculator\backups -Recurse | Measure-Object -Property Length -Sum"

### 5.2 Восстановление через Node.js скрипт
cd D:\bank-calculator\server

# Запуск интерактивного восстановления
npm run restore

# Следуйте инструкциям:
# 1. Выберите номер бэкапа из списка
# 2. Подтвердите действие (введите "ВОССТАНОВИТЬ")
# 3. Дождитесь завершения

### 5.3 Ручное восстановление

# 1. Остановите сервер

# 2. Восстановите базу данных
mongorestore --db bank_calculator --drop D:\bank-calculator\backups\backup_20241230_120000\

# 3. Запустите сервер
cd D:\bank-calculator\server
npm run dev

### 5.4 Восстановление конкретной коллекции

// В MongoDB Shell
use bank_calculator

// Удалить текущую коллекцию (если нужно)
db.calculations.drop()

// Импортировать данные
load('D:/bank-calculator/backups/backup_20241230/calculations.json')

// Проверить
db.calculations.count()

### 5.5 Автоматическое создание бэкапов

# Настройка планировщика Windows для ежедневного бэкапа
schtasks /create /tn "BankCalculatorBackup" /tr "node D:\bank-calculator\server\scripts\backup.js" /sc daily /st 02:00



## 👤 Восстановление администратора

### 6.1 Проверка существования администратора
mongosh
use bank_calculator
db.users.find().pretty()

### 6.2 Создание администратора через скрипт
cd D:\bank-calculator\server
node scripts/createAdmin.js
Ожидаемый вывод:

✅ Администратор успешно создан:
   📧 Логин: admin
   🔑 Пароль: admin123

### 6.3 Ручное создание администратора

// В MongoDB Shell
use bank_calculator

// Удалить старого (если есть)
db.users.deleteMany({ username: "admin" })

// Создать нового (пароль: admin123)
db.users.insertOne({
    username: "admin",
    password: "$2a$10$rQhYJqVqZ5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date()
})

// Проверить
db.users.findOne({ username: "admin" })

### 6.4 Сброс пароля администратора

// В MongoDB Shell
use bank_calculator

// Сгенерировать хэш нового пароля (например, "newpassword123")
// Используйте bcrypt.hashSync("newpassword123", 10)

// Обновить пароль
db.users.updateOne(
    { username: "admin" },
    { $set: { 
        password: "$2a$10$NewHashedPasswordHere",
        updatedAt: new Date()
    }}
)



## 📧 Восстановление email настроек

### 7.1 Настройка Gmail для отправки писем

Шаг 1: Включение двухфакторной аутентификации
Перейдите на https://myaccount.google.com/security
В разделе "Вход в Google" нажмите "Двухэтапная аутентификация"
Следуйте инструкциям

Шаг 2: Создание пароля приложения
Перейдите на https://myaccount.google.com/apppasswords
Выберите "Другое", введите "Финансовый калькулятор"
Нажмите "Создать"
Скопируйте 16-значный пароль

Шаг 3: Обновление .env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx

### 7.2 Проверка email настроек
cd D:\bank-calculator\server
node test-email.js

### 7.3 Альтернативные почтовые сервисы

Yandex:

env
EMAIL_HOST=smtp.yandex.ru
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@yandex.ru
EMAIL_PASS=your_password
Mail.ru:

env
EMAIL_HOST=smtp.mail.ru
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@mail.ru
EMAIL_PASS=your_password



## 🛠️ Скрипт автоматического восстановления

### 2.2 Запуск скрипта recovery.js

Скрипт `server/scripts/recovery.js` автоматически проверяет и восстанавливает:

1. ✅ Подключение к MongoDB
2. ✅ Запуск MongoDB (если не запущена)
3. ✅ Создание администратора (если отсутствует)
4. ✅ Создание индексов в БД
5. ✅ Проверку .env файла
6. ✅ Установку зависимостей

**Запуск скрипта:**

cd D:\bank-calculator\server
npm run recovery

# или

node scripts/recovery.js



## ❓ Частые проблемы и решения

### Проблема 1: Ошибка CORS

Симптомы:
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy

Решение:
// В server.js убедитесь, что CORS настроен правильно
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

### Проблема 2: Email не отправляется

Симптомы:
Invalid login: 535-5.7.8 Username and Password not accepted

Решение:
Используйте пароль приложения, а не обычный пароль
Включите двухфакторную аутентификацию
Проверьте правильность EMAIL_USER в .env

### Проблема 3: Медленная работа

Симптомы:
Запросы выполняются более 1 секунды

Диагностика:
# Просмотр медленных запросов
type server\logs\slow-requests-*.log

Решение:
# Пересоздание индексов MongoDB
mongosh
use bank_calculator
db.calculations.dropIndexes()
db.calculations.createIndex({ createdAt: -1 })
db.calculations.createIndex({ calculatorType: 1, createdAt: -1 })

### Проблема 4: Ошибка модуля не найдена
Симптомы:
Error: Cannot find module '...'

Решение:
# Полная переустановка
cd D:\bank-calculator\server
rm -rf node_modules package-lock.json
npm install

### Проблема 5: Токен истек
Симптомы:
401 Unauthorized в админ-панели

Решение:
Выйдите из админ-панели
Войдите снова (токен будет создан заново)

Если не помогает - очистите localStorage:
localStorage.removeItem('adminToken')
location.reload()

### Проблема 6: База данных заполнена

Симптомы:
Ошибка при сохранении расчетов

Решение:
# Просмотр размера БД
mongosh
use bank_calculator
db.stats()
# Очистка старых расчетов (старше 1 года)
db.calculations.deleteMany({ 
    createdAt: { $lt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
})



## ✅ Чек-лист восстановления

После выполнения восстановления проверьте:

Системные проверки
MongoDB запущена и отвечает на запросы
Сервер запущен на порту 5000
Клиент запущен на порту 3000
Логи пишутся в папку server/logs/

API проверки
curl http://localhost:5000 → возвращает JSON
curl http://localhost:5000/health → статус OK
curl http://localhost:5000/api/calculators → возвращает массив

Функциональные проверки
Администратор может войти в панель (admin/admin123)
Калькуляторы работают и сохраняют расчеты
Email отправляется корректно
Экспорт CSV работает
Статистика отображается

База данных
Пользователь admin существует
Коллекция calculations создана
Индексы созданы



## 📞 Контакты поддержки

**Контакт**	      **Информация**
Разработчик	      Краснюкова Елена Алексеевна
Email	          lenamk019@yandex.ru
Телефон	          +7(###)###-##-##
GitHub	          https://github.com/juliet089/bank-calculator

**Экстренная поддержка**
В случае критических сбоев:

Чат поддержки                 @juliett89
Резервный администратор       ########## ####### ###########
Хостинг провайдер             https://timeweb.com/



## 🚀 Быстрое восстановление (30 секунд)

@echo off
echo ========================================
echo    Быстрое восстановление
echo ========================================

echo 1. Остановка процессов...
taskkill /F /IM node.exe 2>nul
net stop MongoDB 2>nul

echo 2. Запуск MongoDB...
net start MongoDB
timeout /t 2 /nobreak >nul

echo 3. Запуск сервера...
start cmd /k "cd /d D:\bank-calculator\server && npm run dev"
timeout /t 2 /nobreak >nul

echo 4. Запуск клиента...
start cmd /k "cd /d D:\bank-calculator\client && npm start"

echo ========================================
echo    Восстановление завершено!
echo    Сервер: http://localhost:5000
echo    Клиент: http://localhost:3000
echo ========================================
pause

Сохраните этот скрипт как quick-recovery.bat в корне проекта.



## 📚 Дополнительные ресурсы

Официальная документация MongoDB
Документация Express.js
Документация React
GitHub репозиторий проекта

Инструкция актуальна для версии приложения 1.0.0
Последнее обновление: 18 апреля 2026 г.

*Проверено на Windows 10/11, MongoDB 8.2, Node.js 24.14.0*