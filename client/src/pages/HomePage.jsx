import React, { useState } from 'react';
import { formatMoney } from '../utils/loanCalculations';
import './HomePage.css';

// Компонент для отправки email
const EmailSender = ({ calculatorType, inputData, resultData }) => {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    
    const sendToEmail = async () => {
        if (!email) {
            setError('Введите email');
            return;
        }
        
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Введите корректный email (например: user@example.com)');
            return;
        }
        
        setSending(true);
        setError('');
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    calculatorType: calculatorType,
                    inputData: inputData,
                    resultData: resultData
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setSent(true);
                setTimeout(() => setSent(false), 5000);
                setEmail('');
            } else {
                setError(data.message || 'Ошибка отправки. Попробуйте позже.');
            }
        } catch (error) {
            console.error('Ошибка отправки email:', error);
            setError('Не удалось отправить email. Проверьте подключение к интернету.');
        } finally {
            setSending(false);
        }
    };
    
    return (
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
                <button 
                    onClick={sendToEmail} 
                    disabled={sending || !resultData}
                    className="send-email-btn"
                >
                    {sending ? 'Отправка...' : '📧 Отправить на почту'}
                </button>
            </div>
            {error && <div className="email-error">{error}</div>}
            {sent && <div className="email-success">✓ Результаты успешно отправлены на {email}</div>}
        </div>
    );
};

// Ипотечный калькулятор
const MortgageCalculator = () => {
    const [price, setPrice] = useState('');
    const [downPayment, setDownPayment] = useState('');
    const [years, setYears] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [inputData, setInputData] = useState(null);
    
    const calculate = async () => {
        if (!price || !downPayment || !years) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        if (parseFloat(price) <= parseFloat(downPayment)) {
            alert('Первоначальный взнос не может быть больше или равен стоимости квартиры');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'mortgage',
                    inputData: {
                        propertyPrice: parseFloat(price),
                        downPayment: parseFloat(downPayment),
                        years: parseFloat(years)
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setResult(data.result);
                setInputData({
                    propertyPrice: parseFloat(price),
                    downPayment: parseFloat(downPayment),
                    years: parseFloat(years)
                });
                console.log('✅ Ипотека рассчитана и сохранена');
            } else {
                alert('Ошибка при расчете: ' + (data.message || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка подключения к серверу. Убедитесь, что сервер запущен.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="calculator-card">
            <h2>🏠 Ипотечный калькулятор</h2>
            <div className="rate-info">Ставка: 9.6% годовых</div>
            <div className="input-group">
                <label>Стоимость квартиры (₽)</label>
                <input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Например: 2000000"
                    min="0"
                />
            </div>
            <div className="input-group">
                <label>Первоначальный взнос (₽)</label>
                <input 
                    type="number" 
                    value={downPayment} 
                    onChange={(e) => setDownPayment(e.target.value)}
                    placeholder="Например: 500000"
                    min="0"
                />
            </div>
            <div className="input-group">
                <label>Срок кредита (лет)</label>
                <input 
                    type="number" 
                    value={years} 
                    onChange={(e) => setYears(e.target.value)}
                    placeholder="Например: 20"
                    min="1"
                    max="30"
                />
            </div>
            <button onClick={calculate} disabled={loading}>
                {loading ? 'Расчет...' : 'Рассчитать'}
            </button>
            
            {result && !result.error && (
                <>
                    <div className="result">
                        <div className="result-item highlight">
                            <span>Ежемесячный платеж:</span>
                            <strong>{formatMoney(result.monthlyPayment)}</strong>
                        </div>
                        <div className="result-item">
                            <span>Сумма кредита:</span>
                            <span>{formatMoney(result.loanAmount)}</span>
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
                    <EmailSender 
                        calculatorType="mortgage"
                        inputData={inputData}
                        resultData={result}
                    />
                </>
            )}
            {result && result.error && <div className="error">{result.error}</div>}
        </div>
    );
};

// Автокредит
const AutoCreditCalculator = () => {
    const [price, setPrice] = useState('');
    const [downPayment, setDownPayment] = useState('');
    const [years, setYears] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [inputData, setInputData] = useState(null);
    
    const calculate = async () => {
        if (!price || !downPayment || !years) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        if (parseFloat(price) <= parseFloat(downPayment)) {
            alert('Первоначальный взнос не может быть больше или равен стоимости автомобиля');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'autocredit',
                    inputData: {
                        carPrice: parseFloat(price),
                        downPayment: parseFloat(downPayment),
                        years: parseFloat(years)
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setResult(data.result);
                setInputData({
                    carPrice: parseFloat(price),
                    downPayment: parseFloat(downPayment),
                    years: parseFloat(years)
                });
                console.log('✅ Автокредит рассчитан и сохранен');
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
    
    return (
        <div className="calculator-card">
            <h2>🚗 Автокредит</h2>
            <div className="rate-info">Ставка: 3.5% годовых</div>
            <div className="input-group">
                <label>Стоимость автомобиля (₽)</label>
                <input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Например: 1500000"
                    min="0"
                />
            </div>
            <div className="input-group">
                <label>Первоначальный взнос (₽)</label>
                <input 
                    type="number" 
                    value={downPayment} 
                    onChange={(e) => setDownPayment(e.target.value)}
                    placeholder="Например: 300000"
                    min="0"
                />
            </div>
            <div className="input-group">
                <label>Срок кредита (лет)</label>
                <input 
                    type="number" 
                    value={years} 
                    onChange={(e) => setYears(e.target.value)}
                    placeholder="Например: 5"
                    min="1"
                    max="7"
                />
            </div>
            <button onClick={calculate} disabled={loading}>
                {loading ? 'Расчет...' : 'Рассчитать'}
            </button>
            
            {result && !result.error && (
                <>
                    <div className="result">
                        <div className="result-item highlight">
                            <span>Ежемесячный платеж:</span>
                            <strong>{formatMoney(result.monthlyPayment)}</strong>
                        </div>
                        <div className="result-item">
                            <span>Сумма кредита:</span>
                            <span>{formatMoney(result.loanAmount)}</span>
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
                    <EmailSender 
                        calculatorType="autocredit"
                        inputData={inputData}
                        resultData={result}
                    />
                </>
            )}
            {result && result.error && <div className="error">{result.error}</div>}
        </div>
    );
};

// Потребительский кредит
const ConsumerCalculator = () => {
    const [amount, setAmount] = useState('');
    const [years, setYears] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [inputData, setInputData] = useState(null);
    
    const calculate = async () => {
        if (!amount || !years) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'consumer',
                    inputData: {
                        amount: parseFloat(amount),
                        years: parseFloat(years)
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setResult(data.result);
                setInputData({
                    amount: parseFloat(amount),
                    years: parseFloat(years)
                });
                console.log('✅ Потребительский кредит рассчитан и сохранен');
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
    
    return (
        <div className="calculator-card">
            <h2>💳 Потребительский кредит</h2>
            <div className="rate-info">Ставка: 14.5% годовых</div>
            <div className="input-group">
                <label>Сумма кредита (₽)</label>
                <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Например: 500000"
                    min="10000"
                />
            </div>
            <div className="input-group">
                <label>Срок кредита (лет)</label>
                <input 
                    type="number" 
                    value={years} 
                    onChange={(e) => setYears(e.target.value)}
                    placeholder="Например: 3"
                    min="1"
                    max="5"
                />
            </div>
            <button onClick={calculate} disabled={loading}>
                {loading ? 'Расчет...' : 'Рассчитать'}
            </button>
            
            {result && (
                <>
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
                    <EmailSender 
                        calculatorType="consumer"
                        inputData={inputData}
                        resultData={result}
                    />
                </>
            )}
        </div>
    );
};

// Пенсионный калькулятор
const PensionCalculator = () => {
    const [current, setCurrent] = useState('');
    const [monthly, setMonthly] = useState('');
    const [years, setYears] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [inputData, setInputData] = useState(null);
    
    const calculate = async () => {
        if (!years) {
            alert('Пожалуйста, заполните срок накопления');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'pension',
                    inputData: {
                        currentSavings: parseFloat(current) || 0,
                        monthlyContribution: parseFloat(monthly) || 0,
                        years: parseFloat(years)
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setResult(data.result);
                setInputData({
                    currentSavings: parseFloat(current) || 0,
                    monthlyContribution: parseFloat(monthly) || 0,
                    years: parseFloat(years)
                });
                console.log('✅ Пенсионный расчет выполнен и сохранен');
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
    
    return (
        <div className="calculator-card">
            <h2>💰 Пенсионный калькулятор</h2>
            <div className="rate-info">Доходность: 7% годовых</div>
            <div className="input-group">
                <label>Текущие накопления (₽)</label>
                <input 
                    type="number" 
                    value={current} 
                    onChange={(e) => setCurrent(e.target.value)}
                    placeholder="Например: 100000"
                    min="0"
                />
            </div>
            <div className="input-group">
                <label>Ежемесячный взнос (₽)</label>
                <input 
                    type="number" 
                    value={monthly} 
                    onChange={(e) => setMonthly(e.target.value)}
                    placeholder="Например: 5000"
                    min="0"
                />
            </div>
            <div className="input-group">
                <label>Срок накопления (лет)</label>
                <input 
                    type="number" 
                    value={years} 
                    onChange={(e) => setYears(e.target.value)}
                    placeholder="Например: 30"
                    min="1"
                    max="50"
                />
            </div>
            <button onClick={calculate} disabled={loading}>
                {loading ? 'Расчет...' : 'Рассчитать'}
            </button>
            
            {result && (
                <>
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
                    <EmailSender 
                        calculatorType="pension"
                        inputData={inputData}
                        resultData={result}
                    />
                </>
            )}
        </div>
    );
};

// Главный компонент страницы
const HomePage = () => {
    return (
        <div className="home-page">
            <div className="hero">
                <h1>Финансовые калькуляторы</h1>
                <p>Рассчитайте ипотеку, автокредит, потребительский кредит или пенсионные накопления</p>
                <p className="hero-subtitle">Результаты можно отправить на email</p>
            </div>
            <div className="calculators-grid">
                <MortgageCalculator />
                <AutoCreditCalculator />
                <ConsumerCalculator />
                <PensionCalculator />
            </div>
        </div>
    );
};

export default HomePage;