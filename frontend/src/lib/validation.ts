'use client';

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Password validation
export const isValidPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /(.)\1{3,}/, // Repeated characters
    /123456/, // Sequential numbers
    /password/i, // Common passwords
    /qwerty/i,
    /abc123/i
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains weak patterns');
      break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Name validation
export const isValidName = (name: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (name.length > 50) {
    errors.push('Name must be less than 50 characters');
  }
  
  if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
    errors.push('Name can only contain letters, spaces, hyphens, apostrophes, and periods');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Amount validation
export const isValidAmount = (amount: string | number): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    errors.push('Amount must be a valid number');
    return { valid: false, errors };
  }
  
  if (numAmount < 0) {
    errors.push('Amount cannot be negative');
  }
  
  if (numAmount > 999999.99) {
    errors.push('Amount cannot exceed $999,999.99');
  }
  
  if (numAmount < 0.01) {
    errors.push('Amount must be at least $0.01');
  }
  
  // Check for too many decimal places
  const amountStr = amount.toString();
  if (amountStr.includes('.') && amountStr.split('.')[1].length > 2) {
    errors.push('Amount cannot have more than 2 decimal places');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Currency validation
export const isValidCurrency = (currency: string): boolean => {
  const validCurrencies = ['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'JPY'];
  return validCurrencies.includes(currency.toUpperCase());
};

// Phone number validation
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// XSS prevention
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// SQL injection prevention (for display purposes)
export const sanitizeForDisplay = (text: string): string => {
  return escapeHtml(sanitizeInput(text));
};

// Credit card number validation
export const isValidCardNumber = (cardNumber: string): { valid: boolean; brand?: string } => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  // Luhn algorithm
  const luhnCheck = (num: string): boolean => {
    let sum = 0;
    let isEven = false;
    
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };
  
  if (!/^\d{13,19}$/.test(cleanNumber)) {
    return { valid: false };
  }
  
  if (!luhnCheck(cleanNumber)) {
    return { valid: false };
  }
  
  // Detect card brand
  let brand = 'unknown';
  if (/^4/.test(cleanNumber)) {
    brand = 'visa';
  } else if (/^5[1-5]/.test(cleanNumber)) {
    brand = 'mastercard';
  } else if (/^3[47]/.test(cleanNumber)) {
    brand = 'amex';
  } else if (/^6/.test(cleanNumber)) {
    brand = 'discover';
  }
  
  return { valid: true, brand };
};

// CVV validation
export const isValidCVV = (cvv: string, cardBrand?: string): boolean => {
  const cleanCVV = cvv.replace(/\s/g, '');
  
  if (cardBrand === 'amex') {
    return /^\d{4}$/.test(cleanCVV);
  }
  
  return /^\d{3}$/.test(cleanCVV);
};

// Expiry date validation
export const isValidExpiryDate = (month: string, year: string): boolean => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const expMonth = parseInt(month);
  const expYear = parseInt(year);
  
  if (isNaN(expMonth) || isNaN(expYear)) {
    return false;
  }
  
  if (expMonth < 1 || expMonth > 12) {
    return false;
  }
  
  if (expYear < currentYear) {
    return false;
  }
  
  if (expYear === currentYear && expMonth < currentMonth) {
    return false;
  }
  
  // Check if expiry is too far in the future (20 years)
  if (expYear > currentYear + 20) {
    return false;
  }
  
  return true;
};
