const axios = require('axios');

const UNISENDER_API_KEY = process.env.UNISENDER_API_KEY;
const UNISENDER_API_URL = 'https://api.unisender.com/ru/api/sendEmail';

const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', { 
        style: 'currency', 
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = () => {
    return new Date().toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const generateEmailTemplate = (calculatorType, inputData, resultData) => {
    // ... (оставьте без изменений, тот же HTML шаблон)
    // (скопируйте из предыдущего ответа)
};

const sendCalculationResult = async (toEmail, calculatorType, inputData, resultData) => {
    try {
        if (!UNISENDER_API_KEY) {
            throw new Error('UNISENDER_API_KEY не настроен');
        }
        
        const title = {
            mortgage: 'Ипотечный калькулятор',
            autocredit: 'Автокредит',
            consumer: 'Потребительский кредит',
            pension: 'Пенсионный калькулятор'
        }[calculatorType] || 'Финансовый калькулятор';
        
        const html = generateEmailTemplate(calculatorType, inputData, resultData);
        
        console.log(`📧 Отправка email через Unisender на ${toEmail}...`);
        
        // Формируем параметры запроса
        const params = new URLSearchParams();
        params.append('api_key', UNISENDER_API_KEY);
        params.append('email', toEmail);
        params.append('sender_name', 'Финансовый калькулятор');
        params.append('sender_email', process.env.EMAIL_FROM || 'lenamk019@gmail.com');
        params.append('subject', `Результаты расчета - ${title} (${new Date().toLocaleDateString('ru-RU')})`);
        params.append('body', html);
        
        const response = await axios.post(UNISENDER_API_URL, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        if (response.data && response.data.result) {
            console.log('✅ Email успешно отправлен через Unisender!');
            console.log(`   📬 Получатель: ${toEmail}`);
            return { success: true };
        } else {
            throw new Error(response.data.error || 'Неизвестная ошибка');
        }
        
    } catch (error) {
        console.error('❌ Ошибка Unisender:', error.response?.data || error.message);
        throw new Error(`Не удалось отправить email: ${error.message}`);
    }
};

module.exports = { sendCalculationResult, formatMoney, generateEmailTemplate };
