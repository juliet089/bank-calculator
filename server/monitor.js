const axios = require('axios');

const monitor = async () => {
    try {
        const response = await axios.get('http://localhost:5000/health');
        if (response.status === 200 && response.data.mongodb === 'connected') {
            console.log(`✅ [${new Date().toLocaleTimeString()}] Сервер работает`);
        } else {
            console.log(`⚠️ [${new Date().toLocaleTimeString()}] Проблемы с сервером:`, response.data);
        }
    } catch (error) {
        console.error(`❌ [${new Date().toLocaleTimeString()}] Сервер недоступен:`, error.message);
        // Здесь можно добавить отправку уведомления администратору
    }
};

// Запуск мониторинга каждые 5 минут
setInterval(monitor, 5 * 60 * 1000);
monitor();