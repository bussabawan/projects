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

  const rowsPerPage = isMobile ? 5 : 8;

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
        <div className={styles.dateFilters}>
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
        <button 
          className={styles.clearDateBtn}
          onClick={() => {
            setStartDate('');
            setEndDate('');
            setCurrentPage(1);
          }}
          disabled={!startDate && !endDate}
          title="ล้างวันที่"
        >
          <span className={styles.clearBtnText}>ล้างวันที่</span>
          <svg className={styles.clearBtnIcon} width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M19.36 2.73L20.73 4.1L19.3 5.5L17.93 4.13L19.36 2.73M17.27 4.82L18.64 6.2L13.78 11.06L12.41 9.69L17.27 4.82M12 21.05C12 21.58 11.58 22 11.05 22H9.95C9.42 22 9 21.58 9 21.05V17.05H12V21.05M15 17.05H18V21.05C18 21.58 17.58 22 17.05 22H15.95C15.42 22 15 21.58 15 21.05V17.05M6 17.05H9V21.05C9 21.58 8.58 22 8.05 22H6.95C6.42 22 6 21.58 6 21.05V17.05M3 17.05H5V21.05C5 21.58 4.58 22 4.05 22H2.95C2.42 22 2 21.58 2 21.05V17.05M21 15.05H2C1.45 15.05 1 14.6 1 14.05V13.05C1 12.5 1.45 12.05 2 12.05H21C21.55 12.05 22 12.5 22 13.05V14.05C22 14.6 21.55 15.05 21 15.05Z"/>
          </svg>
        </button>
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
