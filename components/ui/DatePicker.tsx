'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatDateForAPI, isValidDate } from '@/lib/utils/formatters';

type CalendarView = 'days' | 'months' | 'years';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
  /**
   * Partner date for range highlight / two-click selection.
   * When set with onRangeChange, picking two days in one open updates both ends.
   */
  rangePartner?: string;
  /** Which field this input represents when rangePartner is set. */
  rangeSide?: 'start' | 'end';
  /** Called after a two-click range selection (dates ordered start ≤ end). */
  onRangeChange?: (start: string, end: string) => void;
  /** Inclusive max span when selecting a range (e.g. 31 for Shopee preview). */
  maxRangeDays?: number;
}

const MONTH_NAMES = [
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

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseYmdLocal(ymd: string): Date | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDaysYmd(ymd: string, days: number): string {
  const d = parseYmdLocal(ymd);
  if (!d) return ymd;
  d.setDate(d.getDate() + days);
  return formatDateForAPI(d);
}

function daySpanInclusive(a: string, b: string): number {
  const da = parseYmdLocal(a);
  const db = parseYmdLocal(b);
  if (!da || !db) return -1;
  const start = da <= db ? da : db;
  const end = da <= db ? db : da;
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function orderRange(a: string, b: string): { start: string; end: string } {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
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
  rangePartner,
  rangeSide,
  onRangeChange,
  maxRangeDays,
}) => {
  const rangeMode = Boolean(rangePartner != null && onRangeChange);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<CalendarView>('days');
  const [inputValue, setInputValue] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? parseYmdLocal(value) : null
  );
  const [currentMonth, setCurrentMonth] = useState(
    () => parseYmdLocal(value) || new Date()
  );
  const [pendingRangeStart, setPendingRangeStart] = useState<string | null>(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const parseDateInput = (input: string): string | null => {
    if (!input || !input.trim()) return null;

    const cleaned = input.trim().replace(/[\s\-_]/g, '/');

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

    const nativeDate = new Date(input);
    if (!isNaN(nativeDate.getTime())) {
      return formatDateForAPI(nativeDate);
    }

    return null;
  };

  const formatDisplayValue = (dateValue?: string) => {
    const val = dateValue || value;
    if (!val) return '';
    const date = parseYmdLocal(val) || new Date(val);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    if (value) {
      const date = parseYmdLocal(value);
      if (date) {
        setSelectedDate(date);
        setCurrentMonth(date);
        setInputValue(formatDisplayValue(value));
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
    if (!isOpen) {
      setPendingRangeStart(null);
      setView('days');
    }
  }, [isOpen]);

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

  const isOutsideAbsoluteBounds = (dateString: string) => {
    if (min && dateString < min) return true;
    if (max && dateString > max) return true;
    return false;
  };

  const commitSingle = (dateString: string) => {
    if (isOutsideAbsoluteBounds(dateString)) return;
    const date = parseYmdLocal(dateString);
    if (!date) return;
    setSelectedDate(date);
    setInputValue(formatDisplayValue(dateString));
    onChange(dateString);
    setIsOpen(false);
  };

  const commitRange = (a: string, b: string) => {
    let { start, end } = orderRange(a, b);
    if (maxRangeDays && daySpanInclusive(start, end) > maxRangeDays) {
      if (a <= b) {
        end = addDaysYmd(start, maxRangeDays - 1);
      } else {
        start = addDaysYmd(end, -(maxRangeDays - 1));
      }
    }
    if (min && start < min) start = min;
    if (max && end > max) end = max;
    if (start > end) return;
    onRangeChange?.(start, end);
    setPendingRangeStart(null);
    setIsOpen(false);
  };

  const handleDateSelect = (day: number) => {
    const dateString = formatDateForAPI(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    );
    if (isOutsideAbsoluteBounds(dateString)) return;

    if (rangeMode && onRangeChange) {
      if (!pendingRangeStart) {
        setPendingRangeStart(dateString);
        return;
      }
      commitRange(pendingRangeStart, dateString);
      return;
    }

    commitSingle(dateString);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const parsed = parseDateInput(newValue);
    if (parsed && isValidDate(parsed)) {
      if (isOutsideAbsoluteBounds(parsed)) return;
      const date = parseYmdLocal(parsed);
      if (!date) return;
      setSelectedDate(date);
      setCurrentMonth(date);
      onChange(parsed);
    }
  };

  const handleInputBlur = () => {
    if (inputValue) {
      const parsed = parseDateInput(inputValue);
      if (parsed && isValidDate(parsed)) {
        const date = parseYmdLocal(parsed);
        if (date && !isOutsideAbsoluteBounds(parsed)) {
          setInputValue(formatDisplayValue(parsed));
          setSelectedDate(date);
          setCurrentMonth(date);
          onChange(parsed);
        } else {
          setInputValue(formatDisplayValue());
        }
      } else {
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
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const yearWindowStart = Math.floor(currentMonth.getFullYear() / 12) * 12;

  const handlePrev = () => {
    if (view === 'days') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    } else if (view === 'months') {
      setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear() - 12, currentMonth.getMonth(), 1));
    }
  };

  const handleNext = () => {
    if (view === 'days') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    } else if (view === 'months') {
      setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear() + 12, currentMonth.getMonth(), 1));
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const rangeStartYmd =
    pendingRangeStart ||
    (rangeMode && rangeSide === 'start'
      ? value
      : rangeMode && rangeSide === 'end'
        ? rangePartner
        : value);
  const rangeEndYmd =
    pendingRangeStart != null
      ? null
      : rangeMode && rangeSide === 'start'
        ? rangePartner
        : rangeMode && rangeSide === 'end'
          ? value
          : rangePartner;

  const highlightStart =
    pendingRangeStart ||
    (rangeStartYmd && rangeEndYmd
      ? orderRange(rangeStartYmd, rangeEndYmd).start
      : rangeStartYmd || value);
  const highlightEnd =
    pendingRangeStart != null
      ? pendingRangeStart
      : rangeStartYmd && rangeEndYmd
        ? orderRange(rangeStartYmd, rangeEndYmd).end
        : value;

  const isDateDisabled = (day: number) => {
    const dateString = formatDateForAPI(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    );
    if (isOutsideAbsoluteBounds(dateString)) return true;
    if (pendingRangeStart && maxRangeDays) {
      const span = daySpanInclusive(pendingRangeStart, dateString);
      if (span > maxRangeDays) return true;
    }
    return false;
  };

  const isDateSelected = (day: number) => {
    const dateString = formatDateForAPI(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    );
    if (rangeMode || pendingRangeStart) {
      return dateString === highlightStart || dateString === highlightEnd;
    }
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isDateInRange = (day: number) => {
    if (!highlightStart || !highlightEnd || highlightStart === highlightEnd) return false;
    const dateString = formatDateForAPI(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    );
    const { start, end } = orderRange(highlightStart, highlightEnd);
    return dateString > start && dateString < end;
  };

  const headerLabel =
    view === 'days' ? null : view === 'months' ? (
      <button
        type="button"
        className="cursor-pointer rounded px-1 text-xs font-semibold text-gray-900 hover:bg-gray-100"
        onClick={() => setView('years')}
      >
        {currentMonth.getFullYear()}
      </button>
    ) : (
      <span className="text-xs font-semibold text-gray-900">
        {yearWindowStart} – {yearWindowStart + 11}
      </span>
    );

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
          if (!isOpen) setIsOpen(true);
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
            className="fixed z-9999 min-w-60 rounded-lg border border-gray-300 bg-white p-2 shadow-xl"
            style={{
              top: `${calendarPosition.top}px`,
              left: `${calendarPosition.left}px`,
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                className="cursor-pointer rounded p-0.5 transition-colors hover:bg-gray-100"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {view === 'days' ? (
                <div className="flex items-center gap-0.5 text-xs font-semibold text-gray-900">
                  <button
                    type="button"
                    className="cursor-pointer rounded px-1 hover:bg-gray-100"
                    onClick={() => setView('months')}
                  >
                    {MONTH_NAMES[currentMonth.getMonth()]}
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer rounded px-1 hover:bg-gray-100"
                    onClick={() => setView('years')}
                  >
                    {currentMonth.getFullYear()}
                  </button>
                </div>
              ) : (
                headerLabel
              )}

              <button
                type="button"
                onClick={handleNext}
                className="cursor-pointer rounded p-0.5 transition-colors hover:bg-gray-100"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {view === 'years' ? (
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 12 }, (_, i) => yearWindowStart + i).map((year) => {
                  const selected = currentMonth.getFullYear() === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      className={`cursor-pointer rounded py-2 text-xs transition-colors ${
                        selected
                          ? 'bg-blue-600 font-medium text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
                        setView('months');
                      }}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {view === 'months' ? (
              <div className="grid grid-cols-3 gap-1">
                {MONTH_SHORT.map((label, monthIndex) => {
                  const active = currentMonth.getMonth() === monthIndex;
                  return (
                    <button
                      key={label}
                      type="button"
                      className={`cursor-pointer rounded py-2 text-xs transition-colors ${
                        active
                          ? 'bg-blue-600 font-medium text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1));
                        setView('days');
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {view === 'days' ? (
              <>
                <div className="mb-1 grid grid-cols-7 gap-0.5">
                  {WEEK_DAYS.map((day) => (
                    <div
                      key={day}
                      className="py-0.5 text-center text-[10px] font-medium text-gray-500"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                  {emptyDays.map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                  ))}
                  {days.map((day) => {
                    const disabled = isDateDisabled(day);
                    const selected = isDateSelected(day);
                    const inRange = isDateInRange(day);
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
                          aspect-square rounded text-xs transition-colors
                          ${
                            disabled
                              ? 'cursor-not-allowed text-gray-300'
                              : selected
                                ? 'cursor-pointer bg-blue-600 font-medium text-white'
                                : inRange
                                  ? 'cursor-pointer bg-blue-100 text-blue-800'
                                  : isToday
                                    ? 'cursor-pointer bg-blue-50 font-medium text-blue-600 hover:bg-blue-100'
                                    : 'cursor-pointer text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {rangeMode ? (
                  <p className="mt-2 border-t border-gray-200 pt-2 text-[10px] text-gray-500">
                    {pendingRangeStart
                      ? maxRangeDays
                        ? `Pick end date (max ${maxRangeDays} days).`
                        : 'Pick end date.'
                      : maxRangeDays
                        ? `Click start, then end (max ${maxRangeDays} days).`
                        : 'Click start date, then end date.'}
                  </p>
                ) : (
                  <div className="mt-2 border-t border-gray-200 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const todayString = formatDateForAPI(new Date());
                        if (!isOutsideAbsoluteBounds(todayString)) {
                          commitSingle(todayString);
                        }
                      }}
                      className="w-full cursor-pointer py-0.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Today
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>,
          document.body
        )}
    </div>
  );
};
