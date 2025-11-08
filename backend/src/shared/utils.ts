import { randomUUID } from 'crypto';

export const generateId = (): string => randomUUID();

export const formatDate = (date: Date): string => date.toISOString();

export const parseDate = (dateString: string): Date => new Date(dateString);

export const roundToDecimal = (value: number, decimals: number = 2): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const calculatePercentageDifference = (
  comparison: number, 
  baseline: number
): number => {
  if (baseline === 0) return 0;
  return ((comparison / baseline) - 1) * 100;
};

export const isValidYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year >= 2020 && year <= currentYear + 10;
};

export const validatePositiveNumber = (value: number, fieldName: string): void => {
  if (value < 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
};

export const validateRequiredString = (value: string, fieldName: string): void => {
  if (!value || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
};
