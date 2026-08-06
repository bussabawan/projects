"use client";

import React, { useState, useEffect } from 'react';
import styles from './history.module.css';

interface PlayDetail {
  id: number;
  time: string;
  icon: string;
  game: string;
  score: string;
  duration: string;
}

interface DayHistory {
  id: number;
  dateStr: string;
  rawDate: string;
  plays: string;
  totalTime: string;
  details: PlayDetail[];
}

export default function HistoryPage() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  
  // Set default dates to match the mockup or last 7 days
  const today = new Date();
  const pastWeek = new Date();
  pastWeek.setDate(today.getDate() - 7);
  
  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const [startDate, setStartDate] = useState<string>(formatDate(pastWeek));
  const [endDate, setEndDate] = useState<string>(formatDate(today));
  
  const [historyData, setHistoryData] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const url = new URL('/api/user/history', window.location.origin);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);

        const res = await fetch(url.toString());
        const json = await res.json();
        if (json.success) {
          setHistoryData(json.data);
          // auto expand the first row if available
          if (json.data.length > 0) {
            setExpandedRow(json.data[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [startDate, endDate]);

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
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>กำลังโหลดข้อมูล...</div>
          ) : historyData.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>ไม่มีประวัติการฝึกในช่วงเวลานี้</div>
          ) : (
            historyData.map((row) => (
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
                            {detail.icon === 'memory' ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 6v6l4 2"></path>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="12" cy="10" r="3"></circle>
                                <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            )}
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
            ))
          )}
        </div>

        {historyData.length > 0 && (
          <div className={styles.pagination}>
            <button className={styles.pageBtn} disabled>
              &laquo;
            </button>
            <button className={styles.pageBtn} disabled>
              &lsaquo;
            </button>
            <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
            <button className={styles.pageBtn} disabled>
              &rsaquo;
            </button>
            <button className={styles.pageBtn} disabled>
              &raquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
