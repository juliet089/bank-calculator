# ФИНАНСОВЫЙ КАЛЬКУЛЯТОР ДЛЯ БАНКА

## ОПИСАНИЕ ПРОЕКТА
Веб-приложение для расчета ипотеки, автокредита, потребительского кредита и пенсионных накоплений.
Результаты расчетов можно отправлять на email. Администратор может просматривать все расчеты,
управлять калькуляторами и экспортировать данные в CSV.

## ТЕХНОЛОГИИ
- Frontend: React 18, React Router DOM, Axios
- Backend: Node.js, Express.js
- База данных: MongoDB, Mongoose ODM
- Аутентификация: JWT, bcryptjs
- Email: Nodemailer (SMTP)
- Стили: CSS3 (адаптивный дизайн)

## ФУНКЦИОНАЛЬНОСТЬ

### Для пользователей:
- Ипотечный калькулятор (ставка 9.6%)
- Автокредит (ставка 3.5%)
- Потребительский кредит (ставка 14.5%)
- Пенсионный калькулятор (доходность 7%)
- Отправка результатов на email
- Адаптивный дизайн для всех устройств

### Для администратора:
- Безопасный вход (JWT токен)
- Просмотр всех расчетов пользователей
- Статистика расчетов (по дням, типам)
- Экспорт всех расчетов в CSV
- Экспорт отдельного расчета в CSV
- Управление калькуляторами (добавление, редактирование, удаление)
- Просмотр деталей каждого расчета
- Адаптивная админ-панель

## УСТАНОВКА И ЗАПУСК

### Требования:
- Node.js (версия 18+)
- MongoDB (версия 6+)
- npm или yarn

### Шаг 1: Клонирование репозитория
git clone https://github.com/your-username/bank-calculator.git
cd bank-calculator

### Шаг 2: Установка зависимостей

Backend:
cd server
npm install

Frontend:
cd client
npm install

### Шаг 3: Настройка переменных окружения

Создайте файл .env в папке server/ со следующим содержимым:

PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bank_calculator
JWT_SECRET=your_super_secret_key_here

# Email настройки (для Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

### Шаг 4: Запуск MongoDB

Windows:
net start MongoDB

Mac:
brew services start mongodb-community

Linux:
sudo systemctl start mongod

### Шаг 5: Запуск приложения

Запуск backend (в отдельном терминале):
cd server
npm run dev

Запуск frontend (в отдельном терминале):
cd client
npm start

### Шаг 6: Создание администратора

cd server
node scripts/createAdmin.js

Данные для входа:
- Логин: admin
- Пароль: admin123

### Шаг 7: Открыть приложение

- Пользовательская часть: http://localhost:3000
- Админ-панель: http://localhost:3000/admin

## СТРУКТУРА ПРОЕКТА

bank-calculator/
├── client/                     # React фронтенд
│   ├── public/                 # Статические файлы
│   └── src/
│       ├── components/         # React компоненты
│       ├── pages/              # Страницы
│       │   ├── HomePage.jsx    # Главная страница (калькуляторы)
│       │   └── AdminPage.jsx   # Админ-панель
│       ├── services/           # API сервисы
│       ├── utils/              # Утилиты
│       └── styles/             # CSS стили
│
├── server/                     # Node.js бэкенд
│   ├── models/                 # Mongoose модели
│   │   ├── User.js             # Пользователи
│   │   ├── Calculation.js      # Расчеты
│   │   └── Calculator.js       # Калькуляторы
│   ├── routes/                 # API маршруты
│   │   ├── adminRoutes.js      # Админ API
│   │   ├── calculationRoutes.js # Расчеты API
│   │   └── calculatorRoutes.js  # Калькуляторы API
│   ├── middleware/             # Middleware
│   ├── utils/                  # Утилиты
│   │   ├── emailService.js     # Отправка email
│   │   └── loanCalculator.js   # Логика расчетов
│   ├── scripts/                # Скрипты
│   │   ├── createAdmin.js      # Создание администратора
│   │   ├── backup.js           # Бэкап БД
│   │   └── recovery.js         # Восстановление
│   ├── logs/                   # Логи приложения
│   └── server.js               # Точка входа
│
├── backups/                    # Резервные копии БД
├── README.md                   # Документация
└── README_RECOVERY.md          # Инструкция по восстановлению

## API ENDPOINTS

### Публичные маршруты

POST   /api/calculate                 - Выполнить расчет
POST   /api/calculate/send-email      - Отправить результат на email
GET    /api/calculators               - Получить список калькуляторов

### Административные маршруты (требуют JWT)

POST   /api/admin/login               - Вход в админ-панель
GET    /api/admin/calculations        - Получить все расчеты
GET    /api/admin/calculations/export - Экспорт в CSV
GET    /api/admin/calculations/stats  - Статистика расчетов
GET    /api/admin/calculators         - Получить калькуляторы
POST   /api/admin/calculators         - Создать калькулятор
PUT    /api/admin/calculators/:id     - Обновить калькулятор
DELETE /api/admin/calculators/:id     - Удалить калькулятор

## НАСТРОЙКА EMAIL

### Для Gmail:
1. Включите двухфакторную аутентификацию в Google
2. Создайте пароль приложения: https://myaccount.google.com/apppasswords
3. Добавьте в .env:
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx

### Для Yandex:
EMAIL_HOST=smtp.yandex.ru
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@yandex.ru
EMAIL_PASS=your_password

### Для Mail.ru:
EMAIL_HOST=smtp.mail.ru
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@mail.ru
EMAIL_PASS=your_password

## ТЕСТИРОВАНИЕ

### Тестовые данные для расчетов:

| Калькулятор     | Входные данные                       | Ожидаемый результат |
|-----------------|--------------------------------------|---------------------|
| Ипотека         | 2,000,000₽, взнос 500,000₽, 20 лет   | 14,080₽/мес         |
| Автокредит      | 1,500,000₽, взнос 300,000₽, 5 лет    | 21,800₽/мес         |
| Потребительский | 500,000₽, 3 года | 17,100₽/мес       | 17,100₽/мес         |
| Пенсионный      | 100,000₽, 5,000₽/мес, 30 лет         | ~7,200,000₽         |

### Тестирование API через командную строку:

# Проверка здоровья сервера
curl http://localhost:5000/health

# Тест расчета
curl -X POST http://localhost:5000/api/calculate -H "Content-Type: application/json" -d "{\"type\":\"mortgage\",\"inputData\":{\"propertyPrice\":2000000,\"downPayment\":500000,\"years\":20}}"

# Вход в админ-панель
curl -X POST http://localhost:5000/api/admin/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"

## УСТРАНЕНИЕ НЕПОЛАДОК

### Ошибка подключения к MongoDB:
Windows: net start MongoDB
Mac: brew services start mongodb-community
Linux: sudo systemctl start mongod

### Ошибка отправки email:
1. Проверьте настройки в .env
2. Для Gmail используйте пароль приложения
3. Проверьте папку "Спам"

### Порт 5000 уже занят:
netstat -ano | findstr :5000
taskkill /PID [PID] /F

### Ошибка аутентификации в админ-панели:
cd server
node scripts/createAdmin.js

## СКРИПТЫ

### Backend (server/package.json):
npm start        - Запуск сервера
npm run dev      - Запуск в режиме разработки
npm run backup   - Создание бэкапа БД
npm run restore  - Восстановление из бэкапа
npm run recovery - Автоматическое восстановление

### Frontend (client/package.json):
npm start        - Запуск приложения
npm run build    - Сборка проекта
npm run test     - Запуск тестов

## ПОЛЕЗНЫЕ ССЫЛКИ

- Документация React: https://reactjs.org/
- Документация Node.js: https://nodejs.org/
- Документация MongoDB: https://docs.mongodb.com/
- Документация Express: https://expressjs.com/

## КОНТАКТЫ

- Разработчик: [Ваше ФИО]
- Email: [your.email@example.com]
- GitHub: https://github.com/your-username

## ЛИЦЕНЗИЯ

Этот проект распространяется под лицензией MIT.

---

⭐ Поставьте звезду на GitHub, если этот проект был полезен!