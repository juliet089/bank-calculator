const { sendCalculationResult, testEmailConfig } = require('./utils/emailService');
const dotenv = require('dotenv');
const path = require('path');

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, '.env') });

const testEmail = async () => {
    console.log('========================================');
    console.log('🔍 Тестирование отправки email');
    console.log('========================================\n');
    
    // Проверяем наличие настроек
    if (!process.env.EMAIL_USER) {
        console.error('❌ ОШИБКА: EMAIL_USER не настроен в .env файле');
        console.log('\n💡 Добавьте в файл .env:');
        console.log('   EMAIL_USER=your_email@gmail.com');
        console.log('   EMAIL_PASS=your_app_password');
        return;
    }
    
    if (!process.env.EMAIL_PASS) {
        console.error('❌ ОШИБКА: EMAIL_PASS не настроен в .env файле');
        console.log('\n💡 Добавьте в файл .env:');
        console.log('   EMAIL_PASS=xxxx xxxx xxxx xxxx (пароль приложения)');
        return;
    }
    
    console.log('📧 Настройки email:');
    console.log(`   Отправитель: ${process.env.EMAIL_USER}`);
    console.log(`   Пароль: ${'*'.repeat(process.env.EMAIL_PASS.length)}`);
    console.log('');
    
    // Тестовые данные для расчета
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
    
    // Спрашиваем email для теста
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('📧 Введите email для тестовой отправки (или нажмите Enter для отправки себе): ', async (answer) => {
        const testEmail = answer.trim() || process.env.EMAIL_USER;
        
        if (!testEmail) {
            console.error('❌ Не указан email для тестирования');
            rl.close();
            return;
        }
        
        console.log(`\n📧 Отправка тестового письма на: ${testEmail}`);
        console.log('⏳ Пожалуйста, подождите...\n');
        
        try {
            const result = await sendCalculationResult(
                testEmail,
                testData.calculatorType,
                testData.inputData,
                testData.resultData
            );
            
            console.log('\n✅ ТЕСТ УСПЕШНО ЗАВЕРШЕН!');
            console.log('========================================');
            console.log(`📬 Письмо отправлено на: ${result.to}`);
            console.log(`📝 ID сообщения: ${result.messageId}`);
            console.log(`📧 Тема: ${result.subject}`);
            console.log('========================================');
            console.log('\n💡 Проверьте папку "Входящие" или "Спам" на указанном email.');
            
        } catch (error) {
            console.error('\n❌ ТЕСТ НЕ УДАЛСЯ!');
            console.error('========================================');
            console.error(`Ошибка: ${error.message}`);
            console.error('========================================');
            
            if (error.message.includes('аутентификации') || error.message.includes('535')) {
                console.log('\n💡 Решение:');
                console.log('1. Убедитесь, что вы используете пароль приложения, а не обычный пароль');
                console.log('2. Для Gmail:');
                console.log('   - Включите двухфакторную аутентификацию');
                console.log('   - Создайте пароль приложения: https://myaccount.google.com/apppasswords');
                console.log('3. Проверьте правильность EMAIL_USER и EMAIL_PASS в .env');
            } else if (error.message.includes('ECONNREFUSED')) {
                console.log('\n💡 Решение:');
                console.log('1. Проверьте интернет-соединение');
                console.log('2. Убедитесь, что брандмауэр не блокирует порт 587');
            } else if (error.message.includes('550')) {
                console.log('\n💡 Решение:');
                console.log('1. Проверьте правильность email получателя');
                console.log('2. Убедитесь, что email существует');
            }
        }
        
        rl.close();
    });
};

// Альтернативный простой тест без ввода email
const simpleTest = async () => {
    console.log('🔍 Простой тест email конфигурации...\n');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Email не настроен');
        return;
    }
    
    console.log(`📧 Отправитель: ${process.env.EMAIL_USER}`);
    console.log('🔄 Проверка подключения к SMTP серверу...\n');
    
    const nodemailer = require('nodemailer');
    
    // Создаем транспорт для проверки
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    
    try {
        // Проверяем подключение
        await transporter.verify();
        console.log('✅ SMTP подключение успешно!');
        console.log('   Ваши настройки email корректны.');
        console.log('\n💡 Теперь вы можете отправить тестовое письмо, запустив:');
        console.log('   node test-email.js');
        
    } catch (error) {
        console.error('❌ Ошибка подключения:', error.message);
        console.log('\n💡 Возможные причины:');
        console.log('1. Неверный EMAIL_USER или EMAIL_PASS');
        console.log('2. Для Gmail нужно использовать пароль приложения, а не обычный');
        console.log('3. Проверьте, что двухфакторная аутентификация включена');
    }
};

// Запускаем тест
if (process.argv.includes('--simple')) {
    simpleTest();
} else {
    testEmail();
}