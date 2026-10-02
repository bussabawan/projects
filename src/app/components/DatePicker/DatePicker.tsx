"use client";

import { useState, useEffect } from 'react';
import styles from './DatePicker.module.css';
import { useScrollLock } from '@/app/hooks/useScrollLock';

interface DatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (dateStr: string) => void;
  initialDate: string;
  title: string;
  align?: 'left' | 'center' | 'right';
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// Monday is the first day of the week based on the image (จ อ พ พฤ ศ ส อา)
const DAYS_OF_WEEK = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

export default function DatePicker({ isOpen, onClose, onSelect, initialDate, title, align = 'center' }: DatePickerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState('');
  
  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (initialDate) {
          const d = new Date(initialDate);
          if (!isNaN(d.getTime())) {
            setCurrentDate(d);
            setSelectedDateStr(initialDate);
          }
        } else {
          setCurrentDate(new Date());
          setSelectedDateStr('');
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDate = (day: number, monthOffset: number = 0) => {
    const d = new Date(currentYear, currentMonth + monthOffset, day);
    // Format to YYYY-MM-DD local time correctly
    const tzoffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 10);
    onSelect(localISOTime);
    onClose();
  };

  const handleClear = () => {
    onSelect('');
    onClose();
  };

  const handleToday = () => {
    const d = new Date();
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 10);
    onSelect(localISOTime);
    onClose();
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay(); // 0 is Sunday
    return day === 0 ? 6 : day - 1; // Convert so Monday is 0, Sunday is 6
  };

  const generateCalendarDays = () => {
    const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
    const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
    const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

    const days = [];

    // Previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isOtherMonth: true, offset: -1 });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({ day: i, isOtherMonth: false, offset: 0 });
    }

    // Next month days to complete 6 rows (42 days)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isOtherMonth: true, offset: 1 });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const displayYear = currentYear; // Do we need +543 for Thai year? The image shows "2026", so no.

  const isSelected = (day: number, offset: number) => {
    if (!selectedDateStr) return false;
    const checkDate = new Date(currentYear, currentMonth + offset, day);
    const tzoffset = checkDate.getTimezoneOffset() * 60000;
    const localCheck = (new Date(checkDate.getTime() - tzoffset)).toISOString().slice(0, 10);
    return localCheck === selectedDateStr;
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div 
        className={`${styles.bottomSheet} ${align === 'right' ? styles.alignRight : align === 'left' ? styles.alignLeft : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className={styles.titlePill}>{title}</div>}
        
        <div className={styles.header}>
          <button className={styles.navButton} onClick={handlePrevMonth}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <div className={styles.monthYearDisplay}>
            {THAI_MONTHS[currentMonth]} {displayYear}
          </div>
          
          <button className={styles.navButton} onClick={handleNextMonth}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <div className={styles.calendarGrid}>
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className={styles.dayOfWeek}>{day}</div>
          ))}
          
          {calendarDays.map((d, index) => {
            const selected = isSelected(d.day, d.offset);
            return (
              <button 
                key={index} 
                className={`${styles.dayButton} ${d.isOtherMonth ? styles.otherMonth : ''} ${selected ? styles.selected : ''}`}
                onClick={() => handleSelectDate(d.day, d.offset)}
              >
                {d.day}
              </button>
            );
          })}
        </div>

        <div className={styles.footer}>
          <button className={styles.clearButton} onClick={handleClear}>ล้าง</button>
          <button className={styles.todayButton} onClick={handleToday}>วันนี้</button>
          <button className={styles.closeButton} onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}
