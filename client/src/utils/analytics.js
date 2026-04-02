// Сбор аналитики о поведении пользователей
const analytics = {
    // Отслеживание расчета
    trackCalculation: async (calculatorType, inputData, resultData) => {
        try {
            // Отправка аналитики на сервер
            await fetch('http://localhost:5000/api/analytics/calculation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    calculatorType,
                    inputData,
                    resultData,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    screenSize: `${window.screen.width}x${window.screen.height}`
                })
            });
        } catch (error) {
            console.error('Ошибка отправки аналитики:', error);
        }
    },
    
    // Отслеживание времени на странице
    trackPageView: (pageName) => {
        // Отправка информации о просмотре страницы
        console.log(`Просмотр страницы: ${pageName}`);
    },
    
    // Отслеживание отправки email
    trackEmailSend: (email) => {
        console.log(`Отправка email на: ${email}`);
    }
};

export default analytics;