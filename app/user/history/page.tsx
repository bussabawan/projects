"use client";

import React, { useState } from 'react';
import styles from './history.module.css';

// Remove static mock data, will fetch dynamically

interface HistoryRow {
  id: number;
  dateStr: string;
  plays: string;
  totalTime: string;
  details: {
    id: number;
    time: string;
    icon: string;
    game: string;
    score: string;
    duration: string;
  }[];
}

export default function HistoryPage() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState<string>(getTodayString());
  const [endDate, setEndDate] = useState<string>(getTodayString());
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const startDateRef = React.useRef<HTMLInputElement>(null);
  const endDateRef = React.useRef<HTMLInputElement>(null);

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const thaiDate = date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return thaiDate.split(' ').join(' / ');
  };

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { getSession } = await import('next-auth/react');
        const session = await getSession();
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        const userId = (session.user as any).id;
        if (!userId) {
          setIsLoading(false);
          return;
        }

        const res = await fetch(`/api/patient-stats/${userId}?period=custom&startDate=${startDate}&endDate=${endDate}`);
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        const { dailyStats, scatterStats } = data;

        const transformedData: HistoryRow[] = dailyStats.map((daily: any, index: number) => {
          const details = scatterStats
            .filter((s: any) => s.dateStr === daily.dateStr)
            .map((s: any, idx: number) => ({
              id: s.id || idx,
              time: s.timeStr,
              icon: "user-square",
              game: s.mode,
              score: `${s.score} คะแนน`,
              duration: `${(s.duration / 60).toFixed(2)} นาที`
            }));
            
          const typesSet = new Set(details.map((d: any) => d.game));

          return {
            id: index + 1,
            dateStr: formatThaiDate(daily.dateStr),
            plays: `${daily.plays} ครั้ง ${typesSet.size} ประเภทเกม`,
            totalTime: `รวม ${daily.totalMinutes} นาที`,
            details
          };
        }).reverse(); // Show latest first

        setHistoryData(transformedData);
        if (transformedData.length > 0) {
          setExpandedRow(transformedData[0].id);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const toggleRow = (id: number) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
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
              ref={startDateRef}
              className={styles.nativeDatePicker}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <button className={styles.datePicker} onClick={() => startDateRef.current?.showPicker()}>
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
              ref={endDateRef}
              className={styles.nativeDatePicker}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button className={styles.datePicker} onClick={() => endDateRef.current?.showPicker()}>
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
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>กำลังโหลดข้อมูล...</div>
          ) : historyData.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>ไม่มีข้อมูลในช่วงเวลานี้</div>
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
            ))
          )}
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
