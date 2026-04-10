import React, { useState, useEffect } from 'react';
import { formatMoney } from '../utils/loanCalculations';
import './HomePage.css';

// API URL из переменной окружения
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Универсальный компонент калькулятора
const CalculatorCard = ({ calculator }) => {
    const [inputs, setInputs] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [emailError, setEmailError] = useState('');

    const calculate = async () => {
        // Проверяем заполнение всех полей
        for (const field of calculator.fields || []) {
            if (field.required && !inputs[field.name]) {
                alert(`Пожалуйста, заполните поле: ${field.label}`);
                return;
            }
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: calculator.name,
                    inputData: inputs
                })
            });
            const data = await response.json();
            if (data.success) {
                setResult(data.result);
            } else {
                alert('Ошибка при расчете: ' + (data.message || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    };

    const sendToEmail = async () => {
        if (!email) {
            setEmailError('Введите email');
            return;
        }
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Введите корректный email');
            return;
        }
// Универсальный компонент калькулятора
const CalculatorCard = ({ calculator }) => {
    const [inputs, setInputs] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [emailError, setEmailError] = useState('');

    const calculate = async () => {
        // Проверяем заполнение всех полей
        for (const field of calculator.fields || []) {
            if (field.required && (!inputs[field.name] && inputs[field.name] !== 0)) {
                alert(`Пожалуйста, заполните поле: ${field.label}`);
                return;
            }
        }

        setLoading(true);
        
        // Подготавливаем данные, преобразуя строки в числа
        const preparedInputs = {};
        for (const [key, value] of Object.entries(inputs)) {
            // Преобразуем в число, если это возможно
            const numValue = parseFloat(value);
            preparedInputs[key] = isNaN(numValue) ? 0 : numValue;
        }
        // Универсальный компонент калькулятора
const CalculatorCard = ({ calculator }) => {
    const [inputs, setInputs] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [emailError, setEmailError] = useState('');

    const calculate = async () => {
        // Проверяем заполнение всех полей
        for (const field of calculator.fields || []) {
            const value = inputs[field.name];
            if (field.required && (value === undefined || value === '' || value === null)) {
                alert(`Пожалуйста, заполните поле: ${field.label}`);
                return;
            }
        }

        setLoading(true);
        
        // Подготавливаем данные, преобразуя строки в числа
        const preparedInputs = {};
        for (const [key, value] of Object.entries(inputs)) {
            if (value === undefined || value === '' || value === null) {
                preparedInputs[key] = 0;
            } else {
                const numValue = Number(value);
                preparedInputs[key] = isNaN(numValue) ? 0 : numValue;
            }
        }
        
        try {
            const response = await fetch(`${API_URL}/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: calculator.name,
                    inputData: preparedInputs
                })
            });
            const data = await response.json();
            if (data.success) {
                setResult(data.result);
            } else {
                alert('Ошибка при расчете: ' + (data.message || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (fieldName, value) => {
        // Если поле пустое, сохраняем пустую строку
        if (value === '' || value === null || value === undefined) {
            setInputs(prev => ({ ...prev, [fieldName]: '' }));
            return;
        }
        
        // Сохраняем как строку, число будем преобразовывать при отправке
        setInputs(prev => ({ ...prev, [fieldName]: value }));
    };

    // Определяем поля ввода из конфигурации калькулятора
    const renderFields = () => {
        // Функция для рендера поля
        const renderInput = (name, label, placeholder) => (
            <div className="input-group" key={name}>
                <label>{label}</label>
                <input
                    type="number"
                    step="any"
                    value={inputs[name] !== undefined && inputs[name] !== '' ? inputs[name] : ''}
                    onChange={(e) => handleInputChange(name, e.target.value)}
                    placeholder={placeholder}
                />
            </div>
        );

        if (!calculator.fields || calculator.fields.length === 0) {
            // Если полей нет, показываем стандартные поля в зависимости от типа
            if (calculator.name === 'pension') {
                return (
                    <>
                        {renderInput('currentSavings', 'Текущие накопления (₽)', 'Например: 100000')}
                        {renderInput('monthlyContribution', 'Ежемесячный взнос (₽)', 'Например: 5000')}
                        {renderInput('years', 'Срок (лет)', 'Например: 30')}
                    </>
                );
            } else {
                return (
                    <>
                        {renderInput('amount', 'Сумма (₽)', 'Например: 500000')}
                        {renderInput('years', 'Срок (лет)', 'Например: 5')}
                    </>
                );
            }
        }

        return calculator.fields.map((field) => (
            <div key={field.name} className="input-group">
                <label>{field.label}</label>
                <input
                    type="number"
                    step="any"
                    value={inputs[field.name] !== undefined && inputs[field.name] !== '' ? inputs[field.name] : ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={`Введите ${field.label.toLowerCase()}`}
                />
            </div>
        ));
    };

    const renderResults = () => {
        if (!result) return null;

        if (calculator.name === 'pension') {
            const years = inputs.years || '?';
            return (
                <div className="result">
                    <div className="result-item highlight">
                        <span>Накопления через {years} лет:</span>
                        <strong>{formatMoney(result.totalSavings)}</strong>
                    </div>
                    <div className="result-item">
                        <span>Общая сумма взносов:</span>
                        <span>{formatMoney(result.totalContributions)}</span>
                    </div>
                    <div className="result-item">
                        <span>Инвестиционный доход:</span>
                        <span>{formatMoney(result.profit)}</span>
                    </div>
                </div>
            );
        }

        return (
            <div className="result">
                <div className="result-item highlight">
                    <span>Ежемесячный платеж:</span>
                    <strong>{formatMoney(result.monthlyPayment)}</strong>
                </div>
                <div className="result-item">
                    <span>Общая сумма выплат:</span>
                    <span>{formatMoney(result.totalPayment)}</span>
                </div>
                <div className="result-item">
                    <span>Переплата:</span>
                    <span>{formatMoney(result.overpayment)}</span>
                </div>
                <div className="result-item">
                    <span>Необходимый доход:</span>
                    <span>{formatMoney(result.requiredIncome)}</span>
                </div>
            </div>
        );
    };

    const sendToEmail = async () => {
        if (!email) {
            setEmailError('Введите email');
            return;
        }
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Введите корректный email');
            return;
        }

        setSending(true);
        setEmailError('');
        
        // Подготавливаем данные для отправки (преобразуем в числа)
        const preparedInputs = {};
        for (const [key, value] of Object.entries(inputs)) {
            if (value === undefined || value === '' || value === null) {
                preparedInputs[key] = 0;
            } else {
                const numValue = Number(value);
                preparedInputs[key] = isNaN(numValue) ? 0 : numValue;
            }
        }
        
        try {
            const response = await fetch(`${API_URL}/calculate/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    calculatorType: calculator.name,
                    inputData: preparedInputs,
                    resultData: result
                })
            });
            const data = await response.json();
            if (data.success) {
                setSent(true);
                setTimeout(() => setSent(false), 5000);
                setEmail('');
            } else {
                setEmailError(data.message || 'Ошибка отправки');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            setEmailError('Не удалось отправить email');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="calculator-card">
            <h2>{calculator.title}</h2>
            <div className="rate-info">Ставка: {calculator.defaultRate}% годовых</div>
            
            {renderFields()}
            
            <button onClick={calculate} disabled={loading}>
                {loading ? 'Расчет...' : 'Рассчитать'}
            </button>
            
            {renderResults()}
            
            {result && (
                <div className="email-section">
                    <div className="email-input-group">
                        <input
                            type="email"
                            placeholder="📧 Введите email для отправки результатов"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={sending}
                            className="email-input"
                        />
                        <button onClick={sendToEmail} disabled={sending} className="send-email-btn">
                            {sending ? 'Отправка...' : '📧 Отправить на почту'}
                        </button>
                    </div>
                    {emailError && <div className="email-error">{emailError}</div>}
                    {sent && <div className="email-success">✓ Результаты отправлены на {email}</div>}
                </div>
            )}
        </div>
    );
};

// Главный компонент страницы
const HomePage = () => {
    const [calculators, setCalculators] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCalculators();
    }, []);

    const fetchCalculators = async () => {
        try {
            const response = await fetch(`${API_URL}/calculators`);
            const data = await response.json();
            // Показываем только активные калькуляторы
            const activeCalculators = data.filter(c => c.isActive === true);
            setCalculators(activeCalculators);
        } catch (error) {
            console.error('Ошибка загрузки калькуляторов:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="home-page">
                <div className="hero">
                    <h1>Финансовые калькуляторы</h1>
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="home-page">
            <div className="hero">
                <h1>Финансовые калькуляторы</h1>
                <p>Рассчитайте ипотеку, автокредит, потребительский кредит или пенсионные накопления</p>
                <p className="hero-subtitle">Результаты можно отправить на email</p>
            </div>
            <div className="calculators-grid">
                {calculators.map(calc => (
                    <CalculatorCard key={calc._id} calculator={calc} />
                ))}
            </div>
        </div>
    );
};

export default HomePage;
