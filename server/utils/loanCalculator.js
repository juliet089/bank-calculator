/**
 * Расчет аннуитетного платежа
 * @param {number} amount - Сумма кредита
 * @param {number} rateYearly - Годовая ставка (%)
 * @param {number} years - Срок кредита в годах
 * @returns {Object} Результаты расчета
 */
const calculateAnnuity = (amount, rateYearly, years) => {
    if (!amount || amount <= 0) {
        throw new Error('Сумма кредита должна быть больше 0');
    }
    
    // Ежемесячная ставка = Годовая ставка / 12 / 100
    const monthlyRate = rateYearly / 12 / 100;
    const months = years * 12;
    
    // Общая ставка = (1 + monthlyRate) ^ months
    const totalRate = Math.pow(1 + monthlyRate, months);
    
    // Ежемесячный платеж = amount * monthlyRate * totalRate / (totalRate - 1)
    const monthlyPayment = amount * monthlyRate * totalRate / (totalRate - 1);
    
    const totalPayment = monthlyPayment * months;
    const overpayment = totalPayment - amount;
    const requiredIncome = monthlyPayment * 2.5; // По условию ТЗ
    
    return {
        monthlyPayment: Math.round(monthlyPayment),
        totalPayment: Math.round(totalPayment),
        overpayment: Math.round(overpayment),
        requiredIncome: Math.round(requiredIncome)
    };
};

/**
 * Расчет ипотеки с учетом первоначального взноса
 */
const calculateMortgage = (propertyPrice, downPayment, rate, years) => {
    const loanAmount = propertyPrice - downPayment;
    if (loanAmount <= 0) {
        throw new Error('Первоначальный взнос не может быть больше или равен стоимости квартиры');
    }
    const result = calculateAnnuity(loanAmount, rate, years);
    return {
        ...result,
        loanAmount: Math.round(loanAmount)
    };
};

/**
 * Расчет автокредита
 */
const calculateAutocredit = (carPrice, downPayment, rate, years) => {
    const loanAmount = carPrice - downPayment;
    if (loanAmount <= 0) {
        throw new Error('Первоначальный взнос не может быть больше или равен стоимости авто');
    }
    const result = calculateAnnuity(loanAmount, rate, years);
    return {
        ...result,
        loanAmount: Math.round(loanAmount)
    };
};

/**
 * Расчет потребительского кредита
 */
const calculateConsumer = (amount, rate, years) => {
    return calculateAnnuity(amount, rate, years);
};

/**
 * Расчет пенсионных накоплений (упрощенная версия)
 */
const calculatePension = (currentSavings, monthlyContribution, years, expectedReturn = 7) => {
    const months = years * 12;
    const monthlyRate = expectedReturn / 12 / 100;
    
    let futureValue = currentSavings * Math.pow(1 + monthlyRate, months);
    
    // Формула будущей стоимости регулярных взносов
    if (monthlyContribution > 0) {
        const futureContributions = monthlyContribution * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
        futureValue += futureContributions;
    }
    
    return {
        totalSavings: Math.round(futureValue),
        totalContributions: Math.round(currentSavings + (monthlyContribution * months)),
        profit: Math.round(futureValue - (currentSavings + (monthlyContribution * months)))
    };
};

module.exports = {
    calculateAnnuity,
    calculateMortgage,
    calculateAutocredit,
    calculateConsumer,
    calculatePension
};