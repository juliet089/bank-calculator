import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Statistics.css';

const Statistics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        fetchStats();
    }, []);
    
    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/calculations/stats');
            console.log('Получена статистика:', response.data);
            
            if (response.data && response.data.success) {
                setStats(response.data.stats);
                setError(null);
            } else {
                setError('Ошибка формата данных');
            }
        } catch (err) {
            console.error('Ошибка загрузки статистики:', err);
            setError(err.response?.data?.message || 'Не удалось загрузить статистику');
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return <div className="stats-loading">📊 Загрузка статистики...</div>;
    }
    
    if (error) {
        return (
            <div className="stats-error">
                <p>❌ {error}</p>
                <button onClick={fetchStats} className="retry-btn">Повторить</button>
            </div>
        );
    }
    
    if (!stats) {
        return (
            <div className="stats-empty">
                <p>📭 Нет данных для статистики</p>
                <button onClick={fetchStats} className="retry-btn">Обновить</button>
            </div>
        );
    }
    
    // Безопасное получение значений с проверкой на undefined
    const total = stats.total || 0;
    const today = stats.today || 0;
    const week = stats.week || 0;
    const month = stats.month || 0;
    const avgMonthlyPayment = stats.avgMonthlyPayment || 0;
    const byType = stats.byType || [];
    const daily = stats.daily || [];
    const topUsers = stats.topUsers || [];
    
    // Определение названий типов калькуляторов
    const getTypeName = (type) => {
        const names = {
            mortgage: '🏠 Ипотека ',
            autocredit: '🚗 Автокредит ',
            consumer: '💳 Потребительский ',
            pension: '💰 Пенсионный '
        };
        return names[type] || type;
    };
    
    // Определение цвета для типа калькулятора
    const getTypeColor = (type) => {
        const colors = {
            mortgage: '#0047ab',
            autocredit: '#28a745',
            consumer: '#ffc107',
            pension: '#17a2b8'
        };
        return colors[type] || '#6c757d';
    };
    
    // Форматирование числа с проверкой
    const formatNumber = (num) => {
        if (!num && num !== 0) return '0';
        return num.toLocaleString('ru-RU');
    };
    
    // Нахождение максимального значения для графика
    const maxDailyTotal = daily.length > 0 ? Math.max(...daily.map(d => d.total || 0)) : 1;
    
    return (
        <div className="statistics-container">
            <h2>📊 Статистика расчетов</h2>
            
            {/* Карточки с общей статистикой */}
            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{formatNumber(total)}</div>
                    <div className="stat-label">Всего расчетов</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-value">{formatNumber(today)}</div>
                    <div className="stat-label">Сегодня</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-value">{formatNumber(week)}</div>
                    <div className="stat-label">За неделю</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-value">{formatNumber(month)}</div>
                    <div className="stat-label">За месяц</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-value">{formatNumber(Math.round(avgMonthlyPayment))} ₽</div>
                    <div className="stat-label">Средний платеж</div>
                </div>
            </div>
            
            {/* Распределение по типам калькуляторов */}
            {byType.length > 0 && (
                <div className="stats-section">
                    <h3>📈 Распределение по типам калькуляторов</h3>
                    <br></br>
                    <div className="type-distribution">
                        {byType.map((item, index) => {
                            const count = item.count || 0;
                            const percent = total > 0 ? (count / total) * 100 : 0;
                            const avgPayment = item.avgMonthlyPayment || 0;
                            
                            return (
                                <div key={item.type || index} className="type-item">
                                    <div className="type-header">
                                        <span className="type-name">{getTypeName(item.type)}</span>
                                        <span className="type-count">{formatNumber(count)} расчетов</span>
                                    </div>
                                    <div className="type-bar-container">
                                        <div 
                                            className="type-bar"
                                            style={{
                                                width: `${percent}%`,
                                                backgroundColor: getTypeColor(item.type)
                                            }}
                                        >
                                            {percent > 15 && (
                                                <span className="type-percent">{Math.round(percent)}%</span>
                                            )}
                                        </div>
                                    </div>
                                    {percent <= 15 && (
                                        <div className="type-percent-outside">
                                            {Math.round(percent)}%
                                        </div>
                                    )}
                                    {avgPayment > 0 && (
                                        <div className="type-details">
                                            <span>Средний платеж: {formatNumber(avgPayment)} ₽</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Динамика по дням */}
            {daily.length > 0 && (
                <div className="stats-section">
                    <h3>📅 Динамика расчетов (последние 7 дней)</h3>
                    <div className="daily-chart">
                        <div className="chart-bars">
                            {daily.map((day, index) => {
                                const dayTotal = day.total || 0;
                                const barHeight = maxDailyTotal > 0 ? (dayTotal / maxDailyTotal) * 150 : 0;
                                
                                return (
                                    <div key={day._id || index} className="chart-column">
                                        <div className="chart-bar-container">
                                            <div 
                                                className="chart-bar"
                                                style={{ height: `${Math.max(barHeight, 4)}px` }}
                                            >
                                                {dayTotal > 0 && (
                                                    <span className="chart-value">{dayTotal}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="chart-label">
                                            {day._id ? new Date(day._id).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '—'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Топ пользователей */}
            {topUsers.length > 0 && (
                <div className="stats-section">
                    <h3>🏆 Топ активных пользователей</h3>
                    <div className="top-users">
                        {topUsers.map((user, index) => (
                            <div key={user._id || index} className="user-item">
                                <div className="user-rank">#{index + 1}</div>
                                <div className="user-email">{user._id || '—'}</div>
                                <div className="user-count">{formatNumber(user.count)} расчетов</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Кнопка обновления */}
            <button onClick={fetchStats} className="refresh-stats-btn">
                🔄 Обновить статистику
            </button>
        </div>
    );
};

export default Statistics;
