"use client";

import React, { useState } from 'react';
import styles from './history.module.css';

// Mock Data based on the provided image
const mockData = [
  {
    id: 1,
    dateStr: "2 มิ.ย. 2564",
    plays: "3 ครั้ง 2 ประเภทเกม",
    totalTime: "รวม 15 นาที",
    details: []
  },
  {
    id: 2,
    dateStr: "1 มิ.ย. 2564",
    plays: "3 ครั้ง 2 ประเภทเกม",
    totalTime: "รวม 15 นาที",
    details: []
  },
  {
    id: 3,
    dateStr: "21 พ.ค. 2564",
    plays: "3 ครั้ง 2 ประเภทเกม",
    totalTime: "รวม 15 นาที",
    details: []
  },
  {
    id: 4,
    dateStr: "20 พ.ค. 2564",
    plays: "3 ครั้ง 2 ประเภทเกม",
    totalTime: "รวม 15 นาที",
    details: [
      { id: 1, time: "20.54", icon: "user-square", game: "ความจำ", score: "44 คะแนน", duration: "5.12 นาที" },
      { id: 2, time: "18.34", icon: "user-square", game: "ความจำ", score: "44 คะแนน", duration: "5.12 นาที" },
      { id: 3, time: "16.22", icon: "user-square", game: "จับคู่", score: "44 คะแนน", duration: "5.12 นาที" }
    ]
  }
];

export default function HistoryPage() {
  const [expandedRow, setExpandedRow] = useState<number | null>(4); // Default to expanding the 4th row for demonstration
  
  // Set default dates to match the mockup
  const [startDate, setStartDate] = useState<string>("2024-06-10");
  const [endDate, setEndDate] = useState<string>("2024-06-21");

  const toggleRow = (id: number) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const thaiDate = date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    // Converts "10 มิ.ย. 2567" to "10 / มิ.ย. / 2567"
    return thaiDate.split(' ').join(' / ');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ประวัติการฝึก</h1>

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <span>เริ่ม</span>
          <div className={styles.datePickerWrapper}>
            <input 
              type="date" 
              className={styles.nativeDatePicker}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <button className={styles.datePicker}>
              {startDate ? formatThaiDate(startDate) : "เลือกวันที่"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
        <div className={styles.filterGroup}>
          <span>สิ้นสุด</span>
          <div className={styles.datePickerWrapper}>
            <input 
              type="date" 
              className={styles.nativeDatePicker}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button className={styles.datePicker}>
              {endDate ? formatThaiDate(endDate) : "เลือกวันที่"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div>วันที่ฝึก</div>
          <div>จำนวนที่เล่น</div>
          <div>รวมเวลา</div>
          <div></div>
        </div>

        <div className={styles.tableBody}>
          {mockData.map((row) => (
            <div key={row.id} className={styles.rowGroup}>
              <div 
                className={`${styles.mainRow} ${expandedRow === row.id ? styles.expanded : ''}`}
                onClick={() => toggleRow(row.id)}
              >
                <div>{row.dateStr}</div>
                <div>{row.plays}</div>
                <div>{row.totalTime}</div>
                <div className={styles.expandIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              {expandedRow === row.id && row.details.length > 0 && (
                <div className={styles.detailsContainer}>
                  {row.details.map((detail, index) => (
                    <div 
                      key={detail.id} 
                      className={styles.detailRow}
                      style={{ backgroundColor: index % 2 === 0 ? '#e2e2e2' : '#c4c4c4' }}
                    >
                      <div>{detail.time}</div>
                      <div className={styles.gameInfo}>
                        <div className={styles.gameIcon}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="12" cy="10" r="3"></circle>
                            <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </div>
                        {detail.game}
                      </div>
                      <div className={styles.detailScore}>{detail.score}</div>
                      <div className={styles.detailDuration}>{detail.duration}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled>
            &laquo;
          </button>
          <button className={styles.pageBtn} disabled>
            &lsaquo;
          </button>
          <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
          <button className={styles.pageBtn}>2</button>
          <button className={styles.pageBtn}>3</button>
          <button className={styles.pageBtn}>4</button>
          <button className={`${styles.pageBtn} ${styles.dotsBtn}`} disabled>...</button>
          <button className={styles.pageBtn}>5</button>
          <button className={styles.pageBtn}>
            &rsaquo;
          </button>
          <button className={styles.pageBtn}>
            &raquo;
          </button>
        </div>
      </div>
    </div>
  );
}
