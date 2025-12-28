// Utility functions for formatting

/**
 * Format currency to Indonesian Rupiah
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "Rp 500.000")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
};

/**
 * Format number with thousand separator (Indonesian format: 1.000.000)
 * @param num - The number to format
 * @returns Formatted number string (e.g., "1.000.000")
 */
export const formatNumber = (num: number | string): string => {
  if (num === '' || num === null || num === undefined) return '';
  const numStr = typeof num === 'string' ? num : num.toString();
  // Remove all non-digit characters
  const digitsOnly = numStr.replace(/\D/g, '');
  if (digitsOnly === '') return '';
  // Add thousand separators
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Parse formatted number string back to number
 * @param formattedStr - Formatted number string (e.g., "1.000.000")
 * @returns Parsed number (e.g., 1000000)
 */
export const parseFormattedNumber = (formattedStr: string): number => {
  if (!formattedStr || formattedStr.trim() === '') return 0;
  // Remove all non-digit characters
  const digitsOnly = formattedStr.replace(/\D/g, '');
  if (digitsOnly === '') return 0;
  return parseInt(digitsOnly, 10) || 0;
};

/**
 * Format date for display
 * @param dateString - ISO date string
 * @returns Formatted date (e.g., "28 Dec 2025")
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/**
 * Format date for API (YYYY-MM-DD)
 * @param date - Date object or ISO string
 * @returns Formatted date string
 */
export const formatDateForAPI = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format datetime for display
 * @param dateString - ISO datetime string
 * @returns Formatted datetime (e.g., "28 Dec 2025, 14:30")
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayFormatted = (): string => {
  return formatDateForAPI(new Date());
};

/**
 * Get first day of current month in YYYY-MM-DD format
 */
export const getFirstDayOfCurrentMonth = (): string => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  return formatDateForAPI(firstDay);
};

/**
 * Get last day of current month in YYYY-MM-DD format
 */
export const getLastDayOfCurrentMonth = (): string => {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return formatDateForAPI(lastDay);
};

/**
 * Parse date input value to Date object
 * @param value - Date input value (YYYY-MM-DD)
 */
export const parseInputDate = (value: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Validate if a date string is valid
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if valid, false otherwise
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  
  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Basic range checks
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Create date object and check if it's valid
  const date = new Date(year, month - 1, day);
  
  // Check if the date components match (this catches invalid dates like 31/11/2025)
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return false;
  }
  
  return true;
};

/**
 * Get the last day of a month
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Last day of the month
 */
export const getLastDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

