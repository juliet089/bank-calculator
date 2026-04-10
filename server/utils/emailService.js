const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Форматирует число в денежный формат
 * @param {number} amount - Сумма для форматирования
 * @returns {string} Отформатированная сумма
 */
const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', { 
        style: 'currency', 
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * Форматирует дату для отображения в письме
 * @returns {string} Отформатированная дата
 */
const formatDate = () => {
    return new Date().toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Генерирует HTML шаблон для письма
 * @param {string} calculatorType - Тип калькулятора
 * @param {object} inputData - Введенные пользователем данные
 * @param {object} resultData - Результаты расчета
 * @returns {string} HTML код письма
 */
const generateEmailTemplate = (calculatorType, inputData, resultData) => {
    const typeNames = {
        mortgage: 'Ипотечный калькулятор',
        autocredit: 'Автокредит',
        consumer: 'Потребительский кредит',
        pension: 'Пенсионный калькулятор'
    };
    
    const typeIcons = {
        mortgage: '🏠',
        autocredit: '🚗',
        consumer: '💳',
        pension: '💰'
    };
    
    const typeRates = {
        mortgage: 9.6,
        autocredit: 3.5,
        consumer: 14.5,
        pension: 7.0
    };
    
    const title = typeNames[calculatorType] || 'Финансовый калькулятор';
    const icon = typeIcons[calculatorType] || '📊';
    const rate = typeRates[calculatorType] || 0;
    const currentDate = formatDate();
    
    // Формируем HTML
    let html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Результаты расчета - ${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #0047ab 0%, #0066cc 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 700;
        }
        
        .header .date {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 8px;
        }
        
        .content {
            padding: 32px;
        }
        
        .info-section {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
        }
        
        .info-section h3 {
            margin: 0 0 16px 0;
            color: #0047ab;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .result-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .result-item:last-child {
            border-bottom: none;
        }
        
        .result-item.highlight {
            background: linear-gradient(135deg, #fff5e6 0%, #fff0e0 100%);
            padding: 16px;
            margin: 12px -16px;
            border-radius: 12px;
            border-bottom: none;
        }
        
        .result-label {
            font-weight: 500;
            color: #6b7280;
            font-size: 14px;
        }
        
        .result-value {
            font-weight: 700;
            color: #0047ab;
            font-size: 18px;
        }
        
        .result-value.large {
            font-size: 24px;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
        }
        
        .note {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin-top: 24px;
            border-radius: 8px;
            font-size: 13px;
            color: #92400e;
        }
        
        .note strong {
            font-weight: 600;
        }
        
        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 12px;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 12px;
            }
            
            .header {
                padding: 24px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .content {
                padding: 20px;
            }
            
            .result-value {
                font-size: 16px;
            }
            
            .result-value.large {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${icon} ${title}</h1>
            <div class="date">${currentDate}</div>
            <div class="badge">Результаты финансового расчета</div>
        </div>
        
        <div class="content">
            <div class="info-section">
                <h3>📝 Введенные данные</h3>`;
    
    // Добавляем введенные данные в зависимости от типа
    if (calculatorType === 'mortgage') {
        html += `
                <div class="result-item">
                    <span class="result-label">Стоимость квартиры:</span>
                    <span class="result-value">${formatMoney(inputData.propertyPrice)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Первоначальный взнос:</span>
                    <span class="result-value">${formatMoney(inputData.downPayment)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Срок кредита:</span>
                    <span class="result-value">${inputData.years} лет (${inputData.years * 12} месяцев)</span>
                </div>`;
        if (inputData.propertyPrice && inputData.downPayment) {
            const loanAmount = inputData.propertyPrice - inputData.downPayment;
            html += `
                <div class="result-item">
                    <span class="result-label">Сумма кредита:</span>
                    <span class="result-value">${formatMoney(loanAmount)}</span>
                </div>`;
        }
    } else if (calculatorType === 'autocredit') {
        html += `
                <div class="result-item">
                    <span class="result-label">Стоимость автомобиля:</span>
                    <span class="result-value">${formatMoney(inputData.carPrice)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Первоначальный взнос:</span>
                    <span class="result-value">${formatMoney(inputData.downPayment)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Срок кредита:</span>
                    <span class="result-value">${inputData.years} лет (${inputData.years * 12} месяцев)</span>
                </div>`;
        if (inputData.carPrice && inputData.downPayment) {
            const loanAmount = inputData.carPrice - inputData.downPayment;
            html += `
                <div class="result-item">
                    <span class="result-label">Сумма кредита:</span>
                    <span class="result-value">${formatMoney(loanAmount)}</span>
                </div>`;
        }
    } else if (calculatorType === 'consumer') {
        html += `
                <div class="result-item">
                    <span class="result-label">Сумма кредита:</span>
                    <span class="result-value">${formatMoney(inputData.amount)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Срок кредита:</span>
                    <span class="result-value">${inputData.years} лет (${inputData.years * 12} месяцев)</span>
                </div>`;
    } else if (calculatorType === 'pension') {
        html += `
                <div class="result-item">
                    <span class="result-label">Текущие накопления:</span>
                    <span class="result-value">${formatMoney(inputData.currentSavings)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Ежемесячный взнос:</span>
                    <span class="result-value">${formatMoney(inputData.monthlyContribution)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Срок накопления:</span>
                    <span class="result-value">${inputData.years} лет (${inputData.years * 12} месяцев)</span>
                </div>`;
    }
    
    html += `
            </div>
            
            <div class="info-section">
                <h3>📈 Результаты расчета</h3>`;
    
    // Добавляем результаты в зависимости от типа
    if (calculatorType !== 'pension') {
        html += `
                <div class="result-item highlight">
                    <span class="result-label">Ежемесячный платеж:</span>
                    <span class="result-value large">${formatMoney(resultData.monthlyPayment)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Процентная ставка:</span>
                    <span class="result-value">${rate}% годовых</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Общая сумма выплат:</span>
                    <span class="result-value">${formatMoney(resultData.totalPayment)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Переплата по кредиту:</span>
                    <span class="result-value">${formatMoney(resultData.overpayment)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Рекомендуемый доход:</span>
                    <span class="result-value">${formatMoney(resultData.requiredIncome)}</span>
                </div>`;
        if (resultData.loanAmount) {
            html += `
                <div class="result-item">
                    <span class="result-label">Сумма кредита:</span>
                    <span class="result-value">${formatMoney(resultData.loanAmount)}</span>
                </div>`;
        }
    } else {
        html += `
                <div class="result-item highlight">
                    <span class="result-label">Накопления через ${inputData.years} лет:</span>
                    <span class="result-value large">${formatMoney(resultData.totalSavings)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Общая сумма взносов:</span>
                    <span class="result-value">${formatMoney(resultData.totalContributions)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Инвестиционный доход:</span>
                    <span class="result-value">${formatMoney(resultData.profit)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Доходность инвестиций:</span>
                    <span class="result-value">${rate}% годовых</span>
                </div>`;
    }
    
    html += `
            </div>
            
            <div class="note">
                <strong>ℹ️ Важно:</strong> Данный расчет носит ознакомительный характер.<br>
                Точные условия кредитования уточняйте в отделении банка.<br>
                Для получения официального предложения обратитесь к специалисту.
            </div>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Финансовый калькулятор</p>
            <p>Это автоматическое сообщение, пожалуйста, не отвечайте на него.</p>
            <p style="margin-top: 8px; font-size: 11px;">Если вы не запрашивали этот расчет, проигнорируйте данное письмо.</p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
};

/**
 * Создает и возвращает настроенный транспорт nodemailer
 */
const getTransporter = () => {
    if (!transporter) {
        const emailUser = process.env.EMAIL_USER;
        const emailDomain = emailUser ? emailUser.split('@')[1] : '';
        
        let config = {};
        
        // Настройки для Яндекс
        if (emailDomain === 'yandex.ru' || emailDomain === 'yandex.ua' || emailDomain === 'yandex.kz') {
            console.log('📧 Используется Яндекс SMTP');
            config = {
                host: process.env.EMAIL_HOST || 'smtp.yandex.ru',
                port: parseInt(process.env.EMAIL_PORT) || 465,
                secure: process.env.EMAIL_SECURE === 'true' || true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                },
                connectionTimeout: 30000,
                greetingTimeout: 30000,
                socketTimeout: 30000
            };
        } 
        // Настройки для Gmail
        else if (emailDomain === 'gmail.com') {
            console.log('📧 Используется Gmail SMTP');
            config = {
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                connectionTimeout: 30000,
                greetingTimeout: 30000,
                socketTimeout: 30000
            };
        } 
        // Настройки для Mail.ru
        else if (emailDomain === 'mail.ru' || emailDomain === 'bk.ru' || emailDomain === 'inbox.ru' || emailDomain === 'list.ru') {
            console.log('📧 Используется Mail.ru SMTP');
            config = {
                host: process.env.EMAIL_HOST || 'smtp.mail.ru',
                port: parseInt(process.env.EMAIL_PORT) || 465,
                secure: process.env.EMAIL_SECURE === 'true' || true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                },
                connectionTimeout: 30000,
                greetingTimeout: 30000,
                socketTimeout: 30000
            };
        }
        // Настройки для Outlook/Hotmail
        else if (emailDomain === 'outlook.com' || emailDomain === 'hotmail.com' || emailDomain === 'live.com') {
            console.log('📧 Используется Outlook SMTP');
            config = {
                host: process.env.EMAIL_HOST || 'smtp-mail.outlook.com',
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: process.env.EMAIL_SECURE === 'true' || false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false,
                    ciphers: 'SSLv3'
                },
                connectionTimeout: 30000,
                greetingTimeout: 30000,
                socketTimeout: 30000
            };
        }
        // Кастомные настройки или другие почтовые сервисы
        else {
            console.log('📧 Используется кастомный SMTP');
            config = {
                host: process.env.EMAIL_HOST || 'smtp.yandex.ru',
                port: parseInt(process.env.EMAIL_PORT) || 465,
                secure: process.env.EMAIL_SECURE === 'true' || true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                },
                connectionTimeout: 30000,
                greetingTimeout: 30000,
                socketTimeout: 30000
            };
        }
        
        console.log('🔧 SMTP конфигурация:', {
            host: config.host || config.service,
            port: config.port || 'auto',
            secure: config.secure || false,
            user: config.auth?.user
        });
        
        transporter = nodemailer.createTransport(config);
    }
    return transporter;
};

/**
 * Основная функция отправки email с результатами расчета
 * @param {string} toEmail - Email получателя
 * @param {string} calculatorType - Тип калькулятора
 * @param {object} inputData - Введенные пользователем данные
 * @param {object} resultData - Результаты расчета
 * @returns {Promise<object>} Результат отправки
 */
const sendCalculationResult = async (toEmail, calculatorType, inputData, resultData) => {
    try {
        // Проверяем наличие email отправителя
        if (!process.env.EMAIL_USER) {
            throw new Error('EMAIL_USER не настроен в .env файле');
        }
        
        if (!process.env.EMAIL_PASS) {
            throw new Error('EMAIL_PASS не настроен в .env файле');
        }
        
        const transporter = getTransporter();
        
        // Проверяем подключение к SMTP серверу
        await transporter.verify();
        console.log('✅ SMTP подключение проверено');
        
        const title = {
            mortgage: 'Ипотечный калькулятор',
            autocredit: 'Автокредит',
            consumer: 'Потребительский кредит',
            pension: 'Пенсионный калькулятор'
        }[calculatorType] || 'Финансовый калькулятор';
        
        const html = generateEmailTemplate(calculatorType, inputData, resultData);
        
        // Простой текст для email-клиентов, не поддерживающих HTML
        const textContent = `
${title} - Результаты расчета

Дата: ${new Date().toLocaleString('ru-RU')}

Введенные данные:
${JSON.stringify(inputData, null, 2)}

Результаты:
${JSON.stringify(resultData, null, 2)}

Важно: Данный расчет носит ознакомительный характер. 
Точные условия кредитования уточняйте в отделении банка.

---
Это автоматическое сообщение, пожалуйста, не отвечайте на него.
        `;
        
        const mailOptions = {
            from: `"Финансовый калькулятор" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `Результаты расчета - ${title} (${new Date().toLocaleDateString('ru-RU')})`,
            html: html,
            text: textContent,
            headers: {
                'X-Priority': '3',
                'X-MSMail-Priority': 'Normal',
                'X-Mailer': 'Financial Calculator v1.0'
            }
        };
        
        console.log(`📧 Отправка email на ${toEmail}...`);
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email успешно отправлен!');
        console.log(`   📝 ID: ${info.messageId}`);
        console.log(`   📬 Получатель: ${toEmail}`);
        
        return { 
            success: true, 
            messageId: info.messageId,
            to: toEmail,
            subject: mailOptions.subject
        };
        
    } catch (error) {
        console.error('❌ Ошибка отправки email:', error.message);
        
        // Детальная диагностика ошибок
        if (error.message.includes('Invalid login') || error.message.includes('535')) {
            throw new Error('Ошибка аутентификации. Проверьте EMAIL_USER и EMAIL_PASS в .env');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
            throw new Error('Не удалось подключиться к SMTP серверу. Проверьте интернет-соединение и настройки портов.');
        } else if (error.message.includes('550')) {
            throw new Error('Email получателя отклонен. Проверьте правильность адреса.');
        } else {
            throw new Error(`Не удалось отправить email: ${error.message}`);
        }
    }
};

/**
 * Тестовая функция для проверки настроек email
 * @param {string} testEmail - Email для тестовой отправки
 * @returns {Promise<object>} Результат теста
 */
const testEmailConfig = async (testEmail = null) => {
    const targetEmail = testEmail || process.env.EMAIL_USER;
    
    if (!targetEmail) {
        throw new Error('Не указан email для тестирования');
    }
    
    const testData = {
        calculatorType: 'mortgage',
        inputData: {
            propertyPrice: 2000000,
            downPayment: 500000,
            years: 20
        },
        resultData: {
            monthlyPayment: 14080,
            loanAmount: 1500000,
            totalPayment: 3379200,
            overpayment: 1879200,
            requiredIncome: 35200
        }
    };
    
    console.log('🔍 Тестирование email конфигурации...');
    console.log(`📧 Отправка тестового письма на ${targetEmail}`);
    
    return await sendCalculationResult(
        targetEmail,
        testData.calculatorType,
        testData.inputData,
        testData.resultData
    );
};

module.exports = { 
    sendCalculationResult,
    testEmailConfig,
    formatMoney,
    generateEmailTemplate
};
