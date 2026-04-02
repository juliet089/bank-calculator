# 🏦 Финансовый калькулятор для банка

[![GitHub repo size](https://img.shields.io/github/repo-size/juliet089/bank-calculator)](https://github.com/juliet089/bank-calculator)
[![GitHub last commit](https://img.shields.io/github/last-commit/juliet089/bank-calculator)](https://github.com/juliet089/bank-calculator)
[![GitHub stars](https://img.shields.io/github/stars/juliet089/bank-calculator?style=social)](https://github.com/juliet089/bank-calculator)
![React](https://img.shields.io/badge/React-18-blue)
![Node.js](https://img.shields.io/badge/Node.js-18-green)
![MongoDB](https://img.shields.io/badge/MongoDB-6-brightgreen)
![License](https://img.shields.io/badge/License-MIT-green)

Веб-приложение для расчета ипотеки, автокредита, потребительского кредита и пенсионных накоплений. Результаты расчетов можно отправлять на email. Администратор может просматривать все расчеты, управлять калькуляторами и экспортировать данные в CSV.

---

## 📋 Содержание

- [Технологии](##технологии)
- [Функциональность](#функциональность)
- [Установка и запуск](#установка-и-запуск)
- [Структура проекта](#структура-проекта)
- [Скриншоты](#скриншоты)
- [Лицензия](#лицензия)

---

## 🛠 Технологии

| Компонент | Технология |
|-----------|------------|
| **Frontend** | React 18, React Router DOM, Axios |
| **Backend** | Node.js, Express.js |
| **База данных** | MongoDB, Mongoose ODM |
| **Аутентификация** | JWT, bcryptjs |
| **Email** | Nodemailer (SMTP) |
| **Стили** | CSS3 (адаптивный дизайн) |

---

## ✨ Функциональность

### 👤 Для пользователей:

| Калькулятор | Процентная ставка | Описание |
|-------------|-------------------|----------|
| 🏠 **Ипотека** | 9.6% годовых | Расчет ежемесячного платежа, общей суммы, переплаты |
| 🚗 **Автокредит** | 3.5% годовых | Расчет с учетом первоначального взноса |
| 💳 **Потребительский кредит** | 14.5% годовых | Расчет для любых целей |
| 💰 **Пенсионный калькулятор** | 7% доходность | Прогноз накоплений на пенсию |

**Дополнительно:**
- 📧 Отправка результатов на email
- 📱 Адаптивный дизайн для всех устройств

### 👨‍💼 Для администратора:

- 🔐 Безопасный вход (JWT токен)
- 📊 Просмотр всех расчетов пользователей
- 📈 Статистика расчетов (по дням, типам)
- 📥 Экспорт всех расчетов в CSV
- 📄 Экспорт отдельного расчета в CSV
- ⚙️ Управление калькуляторами (CRUD)
- 🔍 Просмотр деталей каждого расчета
- 📱 Адаптивная админ-панель

---

## 🚀 Установка и запуск

### Требования

- Node.js (версия 18+)
- MongoDB (версия 6+)
- npm или yarn


### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/juliet089/bank-calculator.git
cd bank-calculator


Шаг 2: Установка зависимостей
Backend:

cd server
npm install

Frontend:

cd client
npm install


Шаг 3: Настройка переменных окружения
Создайте файл .env в папке server/:

PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bank_calculator
JWT_SECRET=your_super_secret_key_here

# Email настройки (для Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password


Шаг 4: Запуск MongoDB
Windows:

net start MongoDB

Mac:

brew services start mongodb-community

Linux:

sudo systemctl start mongod


Шаг 5: Запуск приложения
Запуск backend (в отдельном терминале):

cd server
npm run dev

Запуск frontend (в отдельном терминале):

cd client
npm start


Шаг 6: Создание администратора

cd server
node scripts/createAdmin.js


Данные для входа в админ-панель:

Логин: admin

Пароль: admin123

Шаг 7: Открыть приложение
Пользовательская часть: http://localhost:3000
Админ-панель: http://localhost:3000/admin


📁 Структура проекта

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


📸 Скриншоты
Главная страница: https://github.com/juliet089/bank-calculator/blob/master/screenshots/home.png
[Главная страница (мобильная версия)](https://github.com/juliet089/bank-calculator/blob/master/screenshots/home_mobile.png)
[Админ-панель](https://github.com/juliet089/bank-calculator/blob/master/screenshots/admin.png)
[Админ-панель (мобильная версия)](https://github.com/juliet089/bank-calculator/blob/master/screenshots/admin_mobile.png)
[Админ-панель статистика](https://github.com/juliet089/bank-calculator/blob/master/screenshots/admin_stat.png)
[Админ-панель статистика (мобильная версия)](https://github.com/juliet089/bank-calculator/blob/master/screenshots/admin_stat_mobile.png)
[Админ-панель калькуляторы](https://github.com/juliet089/bank-calculator/blob/master/screenshots/admin_calc.png)
[Админ-панель калькуляторы (мобильная версия)](https://github.com/juliet089/bank-calculator/blob/master/screenshots/admin_calc_mobile.png)


📄 Лицензия
Этот проект распространяется под лицензией MIT. Подробнее см. файл LICENSE.


👤 Автор
Разработчик: Краснюкова Елена Алексеевна
Email: lenamk019@yandex.ru
GitHub: juliet089

⭐ Благодарности
    • React Team
    • MongoDB Team
    • Express.js Team
    • Всем контрибьюторам

⭐ Поставьте звезду на GitHub, если этот проект был полезен!
