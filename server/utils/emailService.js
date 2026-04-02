const nodemailer = require('nodemailer');

// Создаем один экземпляр транспорта (переиспользуем)
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100
        });
    }
    return transporter;
};

// Форматирование денежной суммы
const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', { 
        style: 'currency', 
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Генерация HTML шаблона для email
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
    
    const title = typeNames[calculatorType] || 'Финансовый калькулятор';
    const icon = typeIcons[calculatorType] || '📊';
    const currentDate = new Date().toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Результаты расчета - ${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
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
        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 12px;
        }
        @media (max-width: 600px) {
            .container { margin: 10px; border-radius: 12px; }
            .header { padding: 24px 20px; }
            .header h1 { font-size: 24px; }
            .content { padding: 20px; }
            .result-value { font-size: 16px; }
            .result-value.large { font-size: 20px; }
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
                </div>
                <div class="result-item">
                    <span class="result-label">Сумма кредита:</span>
                    <span class="result-value">${formatMoney(inputData.propertyPrice - inputData.downPayment)}</span>
                </div>`;
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
                </div>
                <div class="result-item">
                    <span class="result-label">Сумма кредита:</span>
                    <span class="result-value">${formatMoney(inputData.carPrice - inputData.downPayment)}</span>
                </div>`;
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
                </div>
                <div class="result-item">
                    <span class="result-label">Прогнозируемая доходность:</span>
                    <span class="result-value">7% годовых</span>
                </div>`;
    }
    
    html += `
            </div>
            
            <div class="info-section">
                <h3>📈 Результаты расчета</h3>`;
    
    // Добавляем результаты в зависимости от типа
    if (calculatorType !== 'pension') {
        const rates = { mortgage: 9.6, autocredit: 3.5, consumer: 14.5 };
        const rate = rates[calculatorType] || 0;
        
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
    } else {
        // ПЕНСИОННЫЙ КАЛЬКУЛЯТОР - специальное отображение
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
                    <span class="result-value">7% годовых</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Эффективность:</span>
                    <span class="result-value">${Math.round((resultData.profit / resultData.totalContributions) * 100)}% к взносам</span>
                </div>`;
    }
    
    html += `
            </div>
            
            <div class="note">
                <strong>ℹ️ Важно:</strong> Данный расчет носит ознакомительный характер.<br>
                Точные условия кредитования уточняйте в отделении банка.
            </div>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Финансовый калькулятор</p>
            <p>Это автоматическое сообщение, пожалуйста, не отвечайте на него.</p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
};

// Основная функция отправки email
const sendCalculationResult = async (toEmail, calculatorType, inputData, resultData) => {
    try {
        const transporter = getTransporter();
        
        // Проверяем наличие данных для пенсионного калькулятора
        if (calculatorType === 'pension') {
            console.log('💰 Отправка пенсионного расчета...');
            console.log('   Накопления:', resultData.totalSavings);
            console.log('   Доход:', resultData.profit);
        }
        
        const title = {
            mortgage: 'Ипотечный калькулятор',
            autocredit: 'Автокредит',
            consumer: 'Потребительский кредит',
            pension: 'Пенсионный калькулятор'
        }[calculatorType] || 'Финансовый калькулятор';
        
        const html = generateEmailTemplate(calculatorType, inputData, resultData);
        
        // Простой текст для email-клиентов без HTML
        let textContent = `${title} - Результаты расчета\n\n`;
        textContent += `Дата: ${new Date().toLocaleString('ru-RU')}\n\n`;
        textContent += `Введенные данные:\n${JSON.stringify(inputData, null, 2)}\n\n`;
        textContent += `Результаты:\n${JSON.stringify(resultData, null, 2)}\n\n`;
        textContent += `Важно: Данный расчет носит ознакомительный характер.`;
        
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
        throw new Error(`Не удалось отправить email: ${error.message}`);
    }
};

module.exports = { sendCalculationResult, formatMoney };