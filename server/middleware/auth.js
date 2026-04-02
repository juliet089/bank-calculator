const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Нет токена авторизации' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        console.error('Ошибка аутентификации:', error);
        res.status(401).json({ message: 'Неверный токен авторизации' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора.' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };