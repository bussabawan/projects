"use client";

import React, { useState } from 'react';
import Loader from '@/app/components/Loader/Loader';
import DatePicker from '@/app/components/DatePicker/DatePicker';
import HistoryModal from '@/app/components/HistoryModal/HistoryModal';
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
  const [selectedRowData, setSelectedRowData] = useState<HistoryRow | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile(); // Check immediately on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const rowsPerPage = isMobile ? 5 : 10;

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
      setIsLoading(true);
      try {
        const { getSession } = await import('next-auth/react');
        const session = await getSession();
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        const userId = (session.user as { id?: string | number }).id;
        if (!userId) {
          setIsLoading(false);
          return;
        }

        const res = await fetch(`/api/patient-history/${userId}?startDate=${startDate}&endDate=${endDate}&page=${currentPage}&limit=${rowsPerPage}`);
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        const { dailyStats, totalPages: fetchedTotalPages } = data;
        setTotalPages(fetchedTotalPages || 1);

        const transformedData: HistoryRow[] = dailyStats.map((daily: { dateStr: string, plays: number, totalMinutes: number, details: { id: number, timeStr: string, mode: string, score: number, duration: number }[] }, index: number) => {
          const details = daily.details.map((d) => ({
            id: d.id,
            time: d.timeStr,
            icon: "user-square",
            game: d.mode,
            score: `${d.score} คะแนน`,
            duration: `${(d.duration / 60).toFixed(2)} นาที`
          }));
            
          const typesSet = new Set(details.map((d) => d.game));

          return {
            id: new Date(daily.dateStr).getTime() + index,
            dateStr: formatThaiDate(daily.dateStr),
            plays: `${daily.plays} ครั้ง (${typesSet.size} เกม)`,
            totalTime: `รวม ${daily.totalMinutes} นาที`,
            details
          };
        });

        setHistoryData(transformedData);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, currentPage, rowsPerPage]);





  const openModal = (row: HistoryRow) => {
    setSelectedRowData(row);
  };

  const closeModal = () => {
    setSelectedRowData(null);
  };

  const currentData = historyData;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ประวัติการฝึก</h1>

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <span>เริ่ม</span>
          <div className={styles.datePickerWrapper}>
            <button className={styles.datePicker} onClick={() => setIsStartPickerOpen(true)}>
              {startDate ? formatThaiDate(startDate) : "เลือกวันที่"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <DatePicker 
              isOpen={isStartPickerOpen} 
              onClose={() => setIsStartPickerOpen(false)} 
              onSelect={(date) => { setStartDate(date); setCurrentPage(1); }} 
              initialDate={startDate} 
              title="เลือกวันที่เริ่มต้น" 
            />
          </div>
        </div>
        <div className={styles.filterGroup}>
          <span>สิ้นสุด</span>
          <div className={styles.datePickerWrapper}>
            <button className={styles.datePicker} onClick={() => setIsEndPickerOpen(true)}>
              {endDate ? formatThaiDate(endDate) : "เลือกวันที่"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <DatePicker 
              isOpen={isEndPickerOpen} 
              onClose={() => setIsEndPickerOpen(false)} 
              onSelect={(date) => { setEndDate(date); setCurrentPage(1); }} 
              initialDate={endDate} 
              title="เลือกวันที่สิ้นสุด" 
            />
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
            <Loader text="กำลังโหลดประวัติการฝึก..." />
          ) : currentData.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>ไม่มีข้อมูลในช่วงเวลานี้</div>
          ) : (
            currentData.map((row) => (
              <div 
                key={row.id} 
                className={styles.rowGroup}
              >
                <div 
                  className={styles.mainRow}
                  onClick={() => openModal(row)}
                >
                  <div>{row.dateStr}</div>
                  <div>{row.plays}</div>
                  <div>{row.totalTime}</div>
                  <div className={styles.expandIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6,9 18,9 12,16"></polygon>
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className={styles.paginationSimple}>
            <button 
              className={styles.pageBtnSimple} 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <span className={styles.pageTextSimple}>{currentPage}</span>

            <button 
              className={styles.pageBtnSimple} 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>

      <HistoryModal 
        isOpen={!!selectedRowData} 
        onClose={closeModal} 
        data={selectedRowData} 
      />
    </div>
  );
}
