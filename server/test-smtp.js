const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const testSMTP = async () => {
    console.log('========================================');
    console.log('🔍 Тест SMTP подключения');
    console.log('========================================\n');
    
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || !emailPass) {
        console.error('❌ EMAIL_USER или EMAIL_PASS не настроены');
        return;
    }
    
    console.log('📧 Отправитель:', emailUser);
    console.log('🔑 Длина пароля:', emailPass.length, 'символов');
    
    // Определяем тип почтового сервиса по домену
    const domain = emailUser.split('@')[1];
    console.log('📮 Домен:', domain);
    
    let transporter;
    
    // Настройка для разных почтовых сервисов
    if (domain === 'gmail.com') {
        console.log('🔧 Используется Gmail SMTP');
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: emailUser, pass: emailPass }
        });
    } else if (domain === 'yandex.ru' || domain === 'yandex.ua') {
        console.log('🔧 Используется Yandex SMTP');
        transporter = nodemailer.createTransport({
            host: 'smtp.yandex.ru',
            port: 465,
            secure: true,
            auth: { user: emailUser, pass: emailPass }
        });
    } else if (domain === 'mail.ru' || domain === 'bk.ru' || domain === 'inbox.ru' || domain === 'list.ru') {
        console.log('🔧 Используется Mail.ru SMTP');
        transporter = nodemailer.createTransport({
            host: 'smtp.mail.ru',
            port: 465,
            secure: true,
            auth: { user: emailUser, pass: emailPass }
        });
    } else if (domain === 'outlook.com' || domain === 'hotmail.com') {
        console.log('🔧 Используется Outlook SMTP');
        transporter = nodemailer.createTransport({
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false,
            auth: { user: emailUser, pass: emailPass }
        });
    } else {
        console.log('🔧 Неизвестный домен, пробуем стандартные настройки');
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: emailUser, pass: emailPass }
        });
    }
    
    try {
        console.log('\n🔄 Проверка подключения...');
        await transporter.verify();
        console.log('✅ Подключение успешно!');
        
        // Отправляем тестовое письмо
        const testTo = 'lenamk019@yandex.ru';
        console.log(`\n📧 Отправка тестового письма на ${testTo}...`);
        
        const info = await transporter.sendMail({
            from: `"Финансовый калькулятор" <${emailUser}>`,
            to: testTo,
            subject: 'Тест отправки письма',
            text: 'Это тестовое письмо из вашего финансового калькулятора.',
            html: `
                <h2>✅ Тест успешен!</h2>
                <p>Ваш финансовый калькулятор настроен правильно.</p>
                <p>Время отправки: ${new Date().toLocaleString('ru-RU')}</p>
                <hr>
                <small>Это автоматическое сообщение, пожалуйста, не отвечайте на него.</small>
            `
        });
        
        console.log('✅ Письмо отправлено!');
        console.log(`📝 ID: ${info.messageId}`);
        console.log('\n💡 Проверьте почту lenamk019@yandex.ru (возможно, в спаме)');
        
    } catch (error) {
        console.error('\n❌ Ошибка:', error.message);
        
        if (error.message.includes('535')) {
            console.log('\n💡 Проблема: неверный пароль');
            console.log('Для Gmail нужно использовать пароль приложения:');
            console.log('1. Перейдите на https://myaccount.google.com/apppasswords');
            console.log('2. Создайте новый пароль');
            console.log('3. Скопируйте 16-значный пароль');
            console.log('4. Вставьте его в .env');
        } else if (error.message.includes('534')) {
            console.log('\n💡 Проблема: требуется пароль приложения');
            console.log('Включите двухфакторную аутентификацию и создайте пароль приложения');
        } else if (error.message.includes('ETIMEDOUT')) {
            console.log('\n💡 Проблема: таймаут подключения');
            console.log('1. Проверьте интернет-соединение');
            console.log('2. Убедитесь, что брандмауэр не блокирует порты');
            console.log('3. Попробуйте позже');
        } else if (error.message.includes('EAUTH')) {
            console.log('\n💡 Проблема: ошибка аутентификации');
            console.log('Проверьте EMAIL_USER и EMAIL_PASS в .env');
        }
    }
};

testSMTP();