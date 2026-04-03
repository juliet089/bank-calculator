import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './AdminPage.css';

// API URL из переменной окружения
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminPage = () => {
    // Состояния для аутентификации
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Состояния для данных
    const [calculations, setCalculations] = useState([]);
    const [calculators, setCalculators] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('calculations');
    
    // Состояния для UI
    const [exporting, setExporting] = useState(false);
    const [exportingSingle, setExportingSingle] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    // Состояния для модальных окон
    const [selectedCalculation, setSelectedCalculation] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingCalculator, setEditingCalculator] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        defaultRate: '',
        description: '',
        isActive: true,
        order: 0,
        fields: []
    });
    
    // Проверка на мобильное устройство
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // Выход из системы
    const handleLogout = useCallback(() => {
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
        setCalculations([]);
        setCalculators([]);
        setStats(null);
        setError('');
    }, []);
    
    // Загрузка расчетов
    const fetchCalculations = useCallback(async () => {
        try {
            const response = await api.get('/admin/calculations');
            setCalculations(response.data.calculations || []);
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            if (error.response?.status === 401) {
                handleLogout();
            }
        }
    }, [handleLogout]);
    
    // Загрузка калькуляторов
    const fetchCalculators = useCallback(async () => {
        try {
            const response = await api.get('/admin/calculators');
            setCalculators(response.data || []);
        } catch (error) {
            console.error('Ошибка загрузки калькуляторов:', error);
        }
    }, []);
    
    // Загрузка статистики
    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get('/admin/calculations/stats');
            setStats(response.data.stats);
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }, []);
    
    // Проверка токена при загрузке
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            setIsAuthenticated(true);
            fetchCalculations();
            fetchCalculators();
            fetchStats();
        }
    }, [fetchCalculations, fetchCalculators, fetchStats]);
    
    // Вход в систему
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await api.post('/admin/login', { username, password });
            
            if (response.data.success && response.data.token) {
                localStorage.setItem('adminToken', response.data.token);
                setIsAuthenticated(true);
                fetchCalculations();
                fetchCalculators();
                fetchStats();
            } else {
                setError('Ошибка входа: ' + (response.data.message || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.message === 'Network Error') {
                setError('Ошибка сети. Убедитесь, что сервер запущен на порту 5000');
            } else {
                setError('Ошибка подключения к серверу');
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Экспорт всех расчетов
    const handleExportAll = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('adminToken');
            
            if (!token) {
                alert('Ошибка: не найден токен авторизации');
                return;
            }
            
            const response = await fetch(`${API_URL}/admin/calculations/export`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}`);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            const date = new Date().toISOString().split('T')[0];
            a.download = `calculations_all_${date}.csv`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            alert('✅ Все расчеты экспортированы!');
            
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            alert('Ошибка экспорта: ' + error.message);
        } finally {
            setExporting(false);
        }
    };
    
    // Экспорт отдельного расчета
    const handleExportSingle = async (calculation) => {
        setExportingSingle(true);
        try {
            const token = localStorage.getItem('adminToken');
            
            if (!token) {
                alert('Ошибка: не найден токен авторизации');
                return;
            }
            
            const exportData = [{
                ID: calculation._id,
                Тип: getCalculatorTypeName(calculation.calculatorType),
                Дата: new Date(calculation.createdAt).toLocaleString('ru-RU'),
                Email: calculation.userEmail || '—',
                IP: calculation.userIp || '—',
                'Входные данные': JSON.stringify(calculation.inputData, null, 2),
                'Результаты': JSON.stringify(calculation.resultData, null, 2)
            }];
            
            const headers = Object.keys(exportData[0]);
            const rows = exportData.map(row => 
                headers.map(header => {
                    let value = row[header];
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            );
            
            const csvContent = [headers.join(','), ...rows].join('\n');
            const bom = '\uFEFF';
            const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `calculation_${calculation._id}_${new Date().toISOString().split('T')[0]}.csv`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('✅ Расчет экспортирован!');
            
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            alert('Ошибка экспорта: ' + error.message);
        } finally {
            setExportingSingle(false);
        }
    };
    
    // Просмотр деталей расчета
    const handleViewDetails = (calculation) => {
        setSelectedCalculation(calculation);
        setShowDetailsModal(true);
    };
    
    // Добавление калькулятора
    const handleAddCalculator = () => {
        setEditingCalculator(null);
        setFormData({
            name: '',
            title: '',
            defaultRate: '',
            description: '',
            isActive: true,
            order: calculators.length,
            fields: []
        });
        setShowForm(true);
    };
    
    // Редактирование калькулятора
    const handleEditCalculator = (calculator) => {
        setEditingCalculator(calculator);
        setFormData({
            name: calculator.name,
            title: calculator.title,
            defaultRate: calculator.defaultRate,
            description: calculator.description || '',
            isActive: calculator.isActive,
            order: calculator.order || 0,
            fields: calculator.fields || []
        });
        setShowForm(true);
    };
    
    // Удаление калькулятора
    const handleDeleteCalculator = async (id, name) => {
        if (!window.confirm(`Вы уверены, что хотите удалить калькулятор "${name}"?`)) {
            return;
        }
        
        try {
            await api.delete(`/admin/calculators/${id}`);
            alert('✅ Калькулятор успешно удален');
            fetchCalculators();
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('❌ Ошибка удаления калькулятора');
        }
    };
    
    // Изменение статуса калькулятора
    const handleToggleCalculatorStatus = async (calculator) => {
        try {
            await api.put(`/admin/calculators/${calculator._id}`, {
                ...calculator,
                isActive: !calculator.isActive
            });
            fetchCalculators();
        } catch (error) {
            console.error('Ошибка изменения статуса:', error);
            alert('❌ Ошибка изменения статуса');
        }
    };
    
    // Сохранение калькулятора
    const handleSaveCalculator = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.title || !formData.defaultRate) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        try {
            if (editingCalculator) {
                await api.put(`/admin/calculators/${editingCalculator._id}`, formData);
                alert('✅ Калькулятор успешно обновлен');
            } else {
                await api.post('/admin/calculators', formData);
                alert('✅ Калькулятор успешно создан');
            }
            setShowForm(false);
            fetchCalculators();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('❌ Ошибка сохранения калькулятора');
        }
    };
    
    // Добавление поля в форму
    const addField = () => {
        setFormData({
            ...formData,
            fields: [...formData.fields, { name: '', label: '', type: 'number', required: true }]
        });
    };
    
    // Обновление поля
    const updateField = (index, field, value) => {
        const newFields = [...formData.fields];
        newFields[index][field] = value;
        setFormData({ ...formData, fields: newFields });
    };
    
    // Удаление поля
    const removeField = (index) => {
        const newFields = formData.fields.filter((_, i) => i !== index);
        setFormData({ ...formData, fields: newFields });
    };
    
    // Вспомогательные функции для отображения
    const getCalculatorTypeName = (type) => {
        const types = {
            mortgage: '🏠 Ипотека',
            autocredit: '🚗 Автокредит',
            consumer: '💳 Потребительский',
            pension: '💰 Пенсионный'
        };
        return types[type] || type;
    };
    
    const getAmount = (calc) => {
        if (calc.calculatorType === 'mortgage') {
            return calc.inputData.propertyPrice?.toLocaleString('ru-RU') || '—';
        }
        if (calc.calculatorType === 'autocredit') {
            return calc.inputData.carPrice?.toLocaleString('ru-RU') || '—';
        }
        if (calc.calculatorType === 'consumer') {
            return calc.inputData.amount?.toLocaleString('ru-RU') || '—';
        }
        if (calc.calculatorType === 'pension') {
            return calc.inputData.currentSavings?.toLocaleString('ru-RU') || '—';
        }
        return '—';
    };
    
    const getPayment = (calc) => {
        if (calc.resultData) {
            if (calc.resultData.monthlyPayment) {
                return `${calc.resultData.monthlyPayment.toLocaleString('ru-RU')} ₽`;
            }
            if (calc.resultData.totalSavings) {
                return `${calc.resultData.totalSavings.toLocaleString('ru-RU')} ₽ (накопления)`;
            }
        }
        return '—';
    };
    
    const getTerm = (calc) => {
        if (calc.inputData.years) {
            return `${calc.inputData.years} лет`;
        }
        return '—';
    };
    
    // Форма входа
    if (!isAuthenticated) {
        return (
            <div className="admin-login">
                <div className="login-card">
                    <h2>🔐 Вход в админ-панель</h2>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>Имя пользователя</label>
                            <input
                                type="text"
                                placeholder="admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="input-group">
                            <label>Пароль</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Вход...' : 'Войти'}
                        </button>
                    </form>
                    <div className="login-hint">
                        <small>Логин: admin | Пароль: admin123</small>
                    </div>
                </div>
            </div>
        );
    }
    
    // Основной рендер админ-панели
    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h1>📊 Админ-панель</h1>
                <button onClick={handleLogout} className="logout-btn">🚪 Выйти</button>
            </div>
            
            <div className="admin-tabs">
                <button 
                    className={activeTab === 'calculations' ? 'active' : ''}
                    onClick={() => setActiveTab('calculations')}
                >
                    📋 Расчеты
                </button>
                <button 
                    className={activeTab === 'statistics' ? 'active' : ''}
                    onClick={() => setActiveTab('statistics')}
                >
                    📊 Статистика
                </button>
                <button 
                    className={activeTab === 'calculators' ? 'active' : ''}
                    onClick={() => setActiveTab('calculators')}
                >
                    ⚙️ Калькуляторы
                </button>
            </div>
            
            {/* Вкладка "Расчеты пользователей" */}
            {activeTab === 'calculations' && (
                <div className="admin-content">
                    <div className="section-header">
                        <h2>📋 Расчеты пользователей</h2>
                        <button 
                            onClick={handleExportAll} 
                            className="export-btn"
                            disabled={exporting || calculations.length === 0}
                        >
                            {exporting ? '⏳ Экспорт...' : '📥 Экспорт всех (CSV)'}
                        </button>
                    </div>
                    
                    {calculations.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <p>Нет данных о расчетах</p>
                            <small>Пользователи еще не выполнили ни одного расчета</small>
                        </div>
                    ) : (
                        <>
                            <div className="stats-info">
                                <span>📊 Всего расчетов: {calculations.length}</span>
                            </div>
                            
                            {isMobile ? (
                                // Мобильный вид - карточки
                                <div className="mobile-cards">
                                    {calculations.map((calc) => (
                                        <div key={calc._id} className="mobile-card">
                                            <div className="mobile-card-header">
                                                <span className="mobile-card-type">{getCalculatorTypeName(calc.calculatorType)}</span>
                                                <span className="mobile-card-date">{new Date(calc.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="mobile-card-content">
                                                <div><strong>Сумма:</strong> {getAmount(calc)} ₽</div>
                                                <div><strong>Срок:</strong> {getTerm(calc)}</div>
                                                <div><strong>Результат:</strong> {getPayment(calc)}</div>
                                                <div><strong>Email:</strong> {calc.userEmail || '—'}</div>
                                            </div>
                                            <div className="mobile-card-actions">
                                                <button onClick={() => handleViewDetails(calc)} className="view-btn-mobile">👁️</button>
                                                <button onClick={() => handleExportSingle(calc)} className="export-single-btn-mobile" disabled={exportingSingle}>📄</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Десктопный вид - таблица
                                <div className="table-container">
                                    <table className="calculations-table">
                                        <thead>
                                            <tr>
                                                <th>Тип</th>
                                                <th>Дата</th>
                                                <th>Email</th>
                                                <th>Сумма</th>
                                                <th>Срок</th>
                                                <th>Результат</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {calculations.map((calc) => (
                                                <tr key={calc._id}>
                                                    <td>{getCalculatorTypeName(calc.calculatorType)}</td>
                                                    <td>{new Date(calc.createdAt).toLocaleString('ru-RU')}</td>
                                                    <td>{calc.userEmail || '—'}</td>
                                                    <td>{getAmount(calc)} ₽</td>
                                                    <td>{getTerm(calc)}</td>
                                                    <td>{getPayment(calc)}</td>
                                                    <td className="actions-cell">
                                                        <button 
                                                            onClick={() => handleViewDetails(calc)}
                                                            className="view-btn"
                                                            title="Просмотреть детали"
                                                        >
                                                            👁️
                                                        </button>
                                                        <button 
                                                            onClick={() => handleExportSingle(calc)}
                                                            className="export-single-btn"
                                                            disabled={exportingSingle}
                                                            title="Экспортировать расчет"
                                                        >
                                                            📄
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
            
            {/* Вкладка "Статистика" */}
            {activeTab === 'statistics' && (
                <div className="admin-content">
                    <div className="section-header">
                        <h2>📊 Статистика расчетов</h2>
                        <button onClick={fetchStats} className="refresh-stats-btn">🔄 Обновить</button>
                    </div>
                    
                    {!stats ? (
                        <div className="empty-state">
                            <div className="empty-icon">📊</div>
                            <p>Загрузка статистики...</p>
                        </div>
                    ) : (
                        <>
                            <div className="stats-cards">
                                <div className="stat-card">
                                    <div className="stat-icon">📋</div>
                                    <div className="stat-value">{stats.total?.toLocaleString() || 0}</div>
                                    <div className="stat-label">Всего расчетов</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">📅</div>
                                    <div className="stat-value">{stats.today?.toLocaleString() || 0}</div>
                                    <div className="stat-label">Сегодня</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">📊</div>
                                    <div className="stat-value">{stats.week?.toLocaleString() || 0}</div>
                                    <div className="stat-label">За неделю</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">📈</div>
                                    <div className="stat-value">{stats.month?.toLocaleString() || 0}</div>
                                    <div className="stat-label">За месяц</div>
                                </div>
                            </div>
                            
                            {stats.byType && stats.byType.length > 0 && (
                                <div className="stats-section">
                                    <h3>📈 Распределение по типам</h3>
                                    <div className="type-distribution">
                                        {stats.byType.map((item) => (
                                            <div key={item._id} className="type-item">
                                                <div className="type-header">
                                                    <span className="type-name">{getCalculatorTypeName(item._id)}</span>
                                                    <span className="type-count">{item.count} расчетов</span>
                                                </div>
                                                <div className="type-bar-container">
                                                    <div 
                                                        className="type-bar"
                                                        style={{ width: `${(item.count / stats.total) * 100}%` }}
                                                    >
                                                        <span className="type-percent">{Math.round((item.count / stats.total) * 100)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
            
            {/* Вкладка "Управление калькуляторами" */}
            {activeTab === 'calculators' && (
                <div className="admin-content">
                    <div className="section-header">
                        <h2>⚙️ Управление калькуляторами</h2>
                        <button onClick={handleAddCalculator} className="add-calculator-btn">
                            ➕ Добавить калькулятор
                        </button>
                    </div>
                    
                    {calculators.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">⚙️</div>
                            <p>Нет созданных калькуляторов</p>
                            <small>Нажмите "Добавить калькулятор" чтобы создать первый</small>
                        </div>
                    ) : (
                        <div className="calculators-list">
                            {calculators.map((calc) => (
                                <div key={calc._id} className={`calculator-item ${!calc.isActive ? 'inactive' : ''}`}>
                                    <div className="calculator-info">
                                        <h3>
                                            {calc.title}
                                            <span className={`status-badge ${calc.isActive ? 'active' : 'inactive'}`}>
                                                {calc.isActive ? 'Активен' : 'Неактивен'}
                                            </span>
                                        </h3>
                                        <p><strong>ID:</strong> {calc.name}</p>
                                        <p><strong>Ставка:</strong> {calc.defaultRate}%</p>
                                        {calc.description && <p><strong>Описание:</strong> {calc.description}</p>}
                                    </div>
                                    <div className="calculator-actions">
                                        <button 
                                            onClick={() => handleToggleCalculatorStatus(calc)}
                                            className={`toggle-btn ${calc.isActive ? 'deactivate' : 'activate'}`}
                                        >
                                            {calc.isActive ? '🔴 Деактивировать' : '🟢 Активировать'}
                                        </button>
                                        <button 
                                            onClick={() => handleEditCalculator(calc)}
                                            className="edit-btn"
                                        >
                                            ✏️ Редактировать
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteCalculator(calc._id, calc.title)}
                                            className="delete-btn"
                                        >
                                            🗑️ Удалить
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {/* Модальное окно для просмотра деталей расчета */}
            {showDetailsModal && selectedCalculation && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🔍 Детали расчета</h3>
                            <button className="close-btn" onClick={() => setShowDetailsModal(false)}>✖</button>
                        </div>
                        
                        <div className="details-content">
                            <div className="details-section">
                                <h4>📋 Общая информация</h4>
                                <div className="details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">ID:</span>
                                        <span className="detail-value">{selectedCalculation._id}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Тип:</span>
                                        <span className="detail-value">{getCalculatorTypeName(selectedCalculation.calculatorType)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Дата:</span>
                                        <span className="detail-value">{new Date(selectedCalculation.createdAt).toLocaleString('ru-RU')}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Email:</span>
                                        <span className="detail-value">{selectedCalculation.userEmail || '—'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">IP адрес:</span>
                                        <span className="detail-value">{selectedCalculation.userIp || '—'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="details-section">
                                <h4>📝 Входные данные</h4>
                                <pre className="details-json">
                                    {JSON.stringify(selectedCalculation.inputData, null, 2)}
                                </pre>
                            </div>
                            
                            <div className="details-section">
                                <h4>📊 Результаты расчета</h4>
                                <pre className="details-json">
                                    {JSON.stringify(selectedCalculation.resultData, null, 2)}
                                </pre>
                            </div>
                            
                            <div className="details-actions">
                                <button 
                                    onClick={() => handleExportSingle(selectedCalculation)}
                                    className="export-single-detail-btn"
                                    disabled={exportingSingle}
                                >
                                    {exportingSingle ? '⏳ Экспорт...' : '📄 Экспортировать в CSV'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Модальное окно для добавления/редактирования калькулятора */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingCalculator ? '✏️ Редактировать калькулятор' : '➕ Новый калькулятор'}</h3>
                            <button className="close-btn" onClick={() => setShowForm(false)}>✖</button>
                        </div>
                        
                        <form onSubmit={handleSaveCalculator}>
                            <div className="details-content">
                                <div className="form-group">
                                    <label>Идентификатор *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="mortgage, autocredit, consumer, pension"
                                        required
                                        disabled={!!editingCalculator}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Название *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        placeholder="Ипотечный калькулятор"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Процентная ставка (%) *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.defaultRate}
                                        onChange={(e) => setFormData({...formData, defaultRate: parseFloat(e.target.value)})}
                                        placeholder="9.6"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Описание</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        rows="3"
                                        placeholder="Описание калькулятора"
                                    />
                                </div>
                                
                                <div className="form-group checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                        />
                                        Активен
                                    </label>
                                </div>
                                
                                <div className="form-group">
                                    <label>Поля ввода</label>
                                    {formData.fields.map((field, index) => (
                                        <div key={index} className="field-item">
                                            <input
                                                type="text"
                                                placeholder="Имя поля"
                                                value={field.name}
                                                onChange={(e) => updateField(index, 'name', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Метка"
                                                value={field.label}
                                                onChange={(e) => updateField(index, 'label', e.target.value)}
                                            />
                                            <select
                                                value={field.type}
                                                onChange={(e) => updateField(index, 'type', e.target.value)}
                                            >
                                                <option value="number">Число</option>
                                                <option value="text">Текст</option>
                                            </select>
                                            <button type="button" onClick={() => removeField(index)} className="remove-field-btn">✖</button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addField} className="add-field-btn">
                                        + Добавить поле
                                    </button>
                                </div>
                                
                                <div className="form-actions">
                                    <button type="submit" className="save-btn">💾 Сохранить</button>
                                    <button type="button" onClick={() => setShowForm(false)} className="cancel-btn">Отмена</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
