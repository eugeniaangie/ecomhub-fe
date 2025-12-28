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
 * Parse date input value to Date object
 * @param value - Date input value (YYYY-MM-DD)
 */
export const parseInputDate = (value: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

