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

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const observer = React.useRef<IntersectionObserver | null>(null);
  const rowsPerPage = 7;

  const startDateRef = React.useRef<HTMLInputElement>(null);
  const endDateRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile(); // Check immediately on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  React.useEffect(() => {
    const fetchData = async () => {
      if (currentPage === 1 || !isMobile) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }
      try {
        const { getSession } = await import('next-auth/react');
        const session = await getSession();
        if (!session?.user) {
          setIsLoading(false);
          setIsFetchingMore(false);
          return;
        }

        const userId = (session.user as any).id;
        if (!userId) {
          setIsLoading(false);
          setIsFetchingMore(false);
          return;
        }

        const res = await fetch(`/api/patient-history/${userId}?startDate=${startDate}&endDate=${endDate}&page=${currentPage}&limit=${rowsPerPage}`);
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        const { dailyStats, totalPages: fetchedTotalPages } = data;
        setTotalPages(fetchedTotalPages || 1);

        const transformedData: HistoryRow[] = dailyStats.map((daily: any, index: number) => {
          const details = daily.details.map((d: any) => ({
            id: d.id,
            time: d.timeStr,
            icon: "user-square",
            game: d.mode,
            score: `${d.score} คะแนน`,
            duration: `${(d.duration / 60).toFixed(2)} นาที`
          }));
            
          const typesSet = new Set(details.map((d: any) => d.game));

          return {
            id: new Date(daily.dateStr).getTime() + index,
            dateStr: formatThaiDate(daily.dateStr),
            plays: `${daily.plays} ครั้ง (${typesSet.size} เกม)`,
            totalTime: `รวม ${daily.totalMinutes} นาที`,
            details
          };
        });

        if (isMobile && currentPage > 1) {
          setHistoryData(prev => {
            const newIds = new Set(transformedData.map(d => d.id));
            return [...prev.filter(d => !newIds.has(d.id)), ...transformedData];
          });
        } else {
          setHistoryData(transformedData);
          if (transformedData.length > 0 && currentPage === 1) {
            setExpandedRow(transformedData[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    };

    fetchData();
  }, [startDate, endDate, currentPage, isMobile]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  const lastElementRef = React.useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore || !isMobile) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, isMobile, currentPage, totalPages]);

  const toggleRow = (id: number) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  const currentData = historyData;

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(currentPage - i) <= 1) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
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
          ) : currentData.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>ไม่มีข้อมูลในช่วงเวลานี้</div>
          ) : (
            currentData.map((row, index) => (
              <div 
                key={row.id} 
                className={styles.rowGroup}
                ref={index === currentData.length - 1 ? lastElementRef : null}
              >
                <div 
                  className={`${styles.mainRow} ${expandedRow === row.id ? styles.expanded : ''}`}
                  onClick={() => toggleRow(row.id)}
                >
                  <div>{row.dateStr}</div>
                  <div>{row.plays}</div>
                  <div>{row.totalTime}</div>
                  <div className={styles.expandIcon}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6,9 18,9 12,16"></polygon>
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
                          <div className={`${styles.gameIcon} ${detail.game === 'จับคู่' ? styles.gameIconMatching : detail.game === 'ความจำ' ? styles.gameIconMemory : ''}`}>
                            {detail.game === 'จับคู่' ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M14.5 12h-5a2.5 2.5 0 0 1-2.5-2.5v-5"></path>
                                <path d="M9.5 12h5a2.5 2.5 0 0 1 2.5 2.5v5"></path>
                                <rect x="5.5" y="4.5" width="4" height="4" rx="1"></rect>
                                <rect x="14.5" y="15.5" width="4" height="4" rx="1"></rect>
                                <circle cx="9.5" cy="15.5" r="1.5" fill="currentColor"></circle>
                                <circle cx="14.5" cy="8.5" r="1.5" fill="currentColor"></circle>
                              </svg>
                            ) : detail.game === 'ความจำ' ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
                                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
                                <line x1="12" y1="4.5" x2="12" y2="19.5"></line>
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
          
          {isFetchingMore && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
              กำลังโหลดเพิ่มเติม...
            </div>
          )}
        </div>

        {!isMobile && totalPages > 1 && (
          <div className={styles.pagination}>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              &laquo;
            </button>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              &lsaquo;
            </button>
            
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <button key={`dots-${index}`} className={`${styles.pageBtn} ${styles.dotsBtn}`} disabled>...</button>
              ) : (
                <button 
                  key={`page-${page}`} 
                  className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
                  onClick={() => setCurrentPage(page as number)}
                >
                  {page}
                </button>
              )
            ))}

            <button 
              className={styles.pageBtn} 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              &rsaquo;
            </button>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              &raquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
