// Утилиты для расчета на фронтенде
export const DEFAULT_RATES = {
    mortgage: 9.6,
    autocredit: 3.5,
    consumer: 14.5,
    pension: 7.0
};

export const calculateAnnuity = (amount, rateYearly, years) => {
    if (!amount || amount <= 0) return null;
    
    const monthlyRate = rateYearly / 12 / 100;
    const months = years * 12;
    const totalRate = Math.pow(1 + monthlyRate, months);
    const monthlyPayment = amount * monthlyRate * totalRate / (totalRate - 1);
    const totalPayment = monthlyPayment * months;
    const overpayment = totalPayment - amount;
    const requiredIncome = monthlyPayment * 2.5;
    
    return {
        monthlyPayment: Math.round(monthlyPayment),
        totalPayment: Math.round(totalPayment),
        overpayment: Math.round(overpayment),
        requiredIncome: Math.round(requiredIncome)
    };
};

export const calculateMortgage = (propertyPrice, downPayment, years) => {
    const loanAmount = propertyPrice - downPayment;
    if (loanAmount <= 0) return { error: 'Первоначальный взнос не может быть больше стоимости' };
    const result = calculateAnnuity(loanAmount, DEFAULT_RATES.mortgage, years);
    return { ...result, loanAmount };
};

export const calculateAutocredit = (carPrice, downPayment, years) => {
    const loanAmount = carPrice - downPayment;
    if (loanAmount <= 0) return { error: 'Первоначальный взнос не может быть больше стоимости' };
    const result = calculateAnnuity(loanAmount, DEFAULT_RATES.autocredit, years);
    return { ...result, loanAmount };
};

export const calculateConsumer = (amount, years) => {
    return calculateAnnuity(amount, DEFAULT_RATES.consumer, years);
};

export const calculatePension = (currentSavings, monthlyContribution, years, expectedReturn = 7) => {
    const months = years * 12;
    const monthlyRate = expectedReturn / 12 / 100;
    
    let futureValue = currentSavings * Math.pow(1 + monthlyRate, months);
    
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

export const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', { 
        style: 'currency', 
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};