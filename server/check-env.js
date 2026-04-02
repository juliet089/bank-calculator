const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('========================================');
console.log('🔍 Проверка настроек .env');
console.log('========================================\n');

console.log('📧 EMAIL_USER:', process.env.EMAIL_USER || '❌ НЕ УСТАНОВЛЕН');

if (process.env.EMAIL_PASS) {
    const passPreview = process.env.EMAIL_PASS.substring(0, 4) + '...' + process.env.EMAIL_PASS.slice(-4);
    console.log('📧 EMAIL_PASS:', '✅ УСТАНОВЛЕН (первые 4 символа: ' + passPreview + ')');
} else {
    console.log('📧 EMAIL_PASS:', '❌ НЕ УСТАНОВЛЕН');
}

if (process.env.EMAIL_HOST) {
    console.log('🔧 EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('🔧 EMAIL_PORT:', process.env.EMAIL_PORT);
} else {
    console.log('🔧 Используется стандартный SMTP (Gmail)');
}

console.log('\n✅ Если EMAIL_USER — ваш реальный email, настройки верны.');
console.log('💡 Для Gmail не нужно указывать EMAIL_HOST и EMAIL_PORT');