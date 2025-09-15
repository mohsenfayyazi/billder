'use client';

// Simple email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Simple password validation
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && password.length <= 128;
};

// Simple amount validation
export const isValidAmount = (amount: string | number): boolean => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount > 0 && numAmount <= 999999.99;
};

// Simple input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().substring(0, 1000);
};

// Simple name validation
export const isValidName = (name: string): boolean => {
  return name && name.trim().length > 0 && name.length <= 50;
};
