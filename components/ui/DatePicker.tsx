'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatDateForAPI, isValidDate } from '@/lib/utils/formatters';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  min,
  max,
  required = false,
  id,
  className = '',
  placeholder = 'DD/MM/YYYY',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || new Date()
  );
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Parse various date formats to YYYY-MM-DD
  const parseDateInput = (input: string): string | null => {
    if (!input || !input.trim()) return null;

    // Remove spaces and common separators
    const cleaned = input.trim().replace(/[\s\-_]/g, '/');

    // Try to parse DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      const d = parseInt(day, 10);
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        const date = new Date(y, m - 1, d);
        if (
          date.getDate() === d &&
          date.getMonth() === m - 1 &&
          date.getFullYear() === y
        ) {
          return formatDateForAPI(date);
        }
      }
    }

    // Try to parse YYYY-MM-DD
    const yyyymmdd = cleaned.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (yyyymmdd) {
      const [, year, month, day] = yyyymmdd;
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const d = parseInt(day, 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        const date = new Date(y, m - 1, d);
        if (
          date.getDate() === d &&
          date.getMonth() === m - 1 &&
          date.getFullYear() === y
        ) {
          return formatDateForAPI(date);
        }
      }
    }

    // Try native Date parsing as fallback
    const nativeDate = new Date(input);
    if (!isNaN(nativeDate.getTime())) {
      return formatDateForAPI(nativeDate);
    }

    return null;
  };

  // Format value to display (DD/MM/YYYY)
  const formatDisplayValue = (dateValue?: string) => {
    const val = dateValue || value;
    if (!val) return '';
    const date = new Date(val);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentMonth(date);
        const formatted = formatDisplayValue(value);
        setInputValue(formatted);
      } else {
        setSelectedDate(null);
        setInputValue('');
      }
    } else {
      setSelectedDate(null);
      setInputValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const updateCalendarPosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCalendarPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
    };

    if (isOpen) {
      // Calculate position when opening
      updateCalendarPosition();
      
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updateCalendarPosition, true);
      window.addEventListener('resize', updateCalendarPosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updateCalendarPosition, true);
      window.removeEventListener('resize', updateCalendarPosition);
    };
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = formatDateForAPI(newDate);
    
    // Validate min/max
    if (min && dateString < min) return;
    if (max && dateString > max) return;
    
    setSelectedDate(newDate);
    setInputValue(formatDisplayValue(dateString));
    onChange(dateString);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Try to parse the input
    const parsed = parseDateInput(newValue);
    if (parsed && isValidDate(parsed)) {
      // Validate min/max
      if (min && parsed < min) return;
      if (max && parsed > max) return;

      const date = new Date(parsed);
      setSelectedDate(date);
      setCurrentMonth(date);
      onChange(parsed);
    }
  };

  const handleInputBlur = () => {
    // On blur, format the input if valid, otherwise reset to value
    if (inputValue) {
      const parsed = parseDateInput(inputValue);
      if (parsed && isValidDate(parsed)) {
        const date = new Date(parsed);
        // Validate min/max
        if ((!min || parsed >= min) && (!max || parsed <= max)) {
          setInputValue(formatDisplayValue(parsed));
          setSelectedDate(date);
          setCurrentMonth(date);
          onChange(parsed);
        } else {
          // Invalid range, reset to original value
          setInputValue(formatDisplayValue());
        }
      } else {
        // Invalid format, reset to original value
        setInputValue(formatDisplayValue());
      }
    } else {
      setInputValue(formatDisplayValue());
    }
  };

  const handleCalendarIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
    // Focus input after opening calendar
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isDateDisabled = (day: number) => {
    const dateString = formatDateForAPI(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    );
    if (min && dateString < min) return true;
    if (max && dateString > max) return true;
    return false;
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        id={id}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={() => {
          // Keep calendar open if already open
          if (!isOpen) {
            setIsOpen(true);
          }
        }}
        onClick={() => setIsOpen(true)}
        className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        placeholder={placeholder}
        required={required}
      />
      <button
        type="button"
        onClick={handleCalendarIconClick}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        tabIndex={-1}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={calendarRef}
            className="fixed z-9999 bg-white border border-gray-300 rounded-lg shadow-xl p-2 min-w-[240px]"
            style={{
              top: `${calendarPosition.top}px`,
              left: `${calendarPosition.left}px`,
            }}
          >
          {/* Month/Year Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-xs font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {weekDays.map((day) => (
              <div key={day} className="text-[10px] font-medium text-gray-500 text-center py-0.5">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const disabled = isDateDisabled(day);
              const selected = isDateSelected(day);
              const isToday =
                day === new Date().getDate() &&
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear();

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                  className={`
                    aspect-square text-xs rounded transition-colors
                    ${disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : selected
                        ? 'bg-blue-600 text-white font-medium'
                        : isToday
                          ? 'bg-blue-50 text-blue-600 font-medium hover:bg-blue-100'
                          : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const todayString = formatDateForAPI(today);
                if ((!min || todayString >= min) && (!max || todayString <= max)) {
                  setSelectedDate(today);
                  onChange(todayString);
                  setIsOpen(false);
                }
              }}
              className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-0.5"
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

