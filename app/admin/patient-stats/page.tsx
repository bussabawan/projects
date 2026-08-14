"use client";

import React, { useEffect, useState } from 'react';
import LoadingSpinner from "@/app/components/LoadingSpinner/LoadingSpinner";
import styles from './patientStats.module.css';
import { PatientStatInfo } from '@/lib/models/patientStats';
import { useDebounce } from '@/app/hooks/useDebounce';
import PatientStatsPopup from './components/PatientStatsPopup';

const extractCategory = (testSet?: string) => {
  if (!testSet) return '';
  const match = testSet.match(/หมวด(.*?)(?:\s+เลเวล|$)/);
  return match ? match[1].trim() : testSet;
};

const renderTestSetTags = (patient: PatientStatInfo) => {
  const assignedSets = patient.assignedSets;
  if (!assignedSets || assignedSets.length === 0) return null;
  
  // Deduplicate by the exact assigned string to accurately check play history
  const uniqueAssignedSets = Array.from(new Set(assignedSets.filter(Boolean)));
  
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {uniqueAssignedSets.map((setStr, idx) => {
        const tag = extractCategory(setStr) || setStr;
        const isPlayed = (patient.playedSets || []).includes(setStr);
        
        let tagClass = styles.testSetTag;
        if (isPlayed) {
          tagClass = `${styles.testSetTag} ${styles.playedTag}`;
        }
        
        return (
          <span key={idx} className={tagClass}>{tag}</span>
        );
      })}
    </div>
  );
};

export default function PatientStatsPage() {
  const [patients, setPatients] = useState<PatientStatInfo[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientStatInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [mobileVisibleCount, setMobileVisibleCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>();

  const selectedPatient = patients.find(p => String(p.id) === String(selectedPatientId));

  const uniqueCategories = Array.from(new Set(
    (selectedPatient?.testSets || []).map(ts => extractCategory(ts)).filter(Boolean)
  ));

  const uniqueExerciseSets = Array.from(new Set(
    (selectedPatient?.testSets || []).filter(Boolean)
  ));

  const openPopup = (id: string) => {
    setSelectedPatientId(id);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedPatientId(undefined);
  };

  const observer = React.useRef<IntersectionObserver | null>(null);
  const lastElementRef = React.useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setMobileVisibleCount(prev => prev + 10);
      }
    }, { rootMargin: '100px' });
    
    if (node) observer.current.observe(node);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/patient-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch patient statistics');
        }
        const data = await response.json();
        setPatients(data);
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    let result = patients;

    if (debouncedSearchQuery.trim() !== '') {
      const lowerQuery = debouncedSearchQuery.toLowerCase();
      result = result.filter(patient => 
        (patient.name && patient.name.toLowerCase().includes(lowerQuery)) || 
        (patient.patientId && patient.patientId.toLowerCase().includes(lowerQuery))
      );
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredPatients(result);
    setCurrentPage(1);
    setMobileVisibleCount(10);
  }, [debouncedSearchQuery, patients]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const currentPatients = filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerArea}>
        <h1 className={styles.title}>สถิติผู้ป่วยรายบุคคล</h1>
        <div className={styles.controlsContainer}>
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="ค้นหา" 
              value={searchQuery}
              onChange={handleSearch}
            />
            <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="กำลังโหลดข้อมูล..." />
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>เกิดข้อผิดพลาด: {error}</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell}>ชื่อ - นามสกุล</div>
              <div className={styles.headerCell}>รหัสผู้ป่วย</div>
              <div className={styles.headerCell}>ชุดแบบฝึกหัด</div>
              <div className={styles.headerCell}>รายละเอียด</div>
            </div>
            <div className={styles.tableBody}>
              {currentPatients.length > 0 ? currentPatients.map((patient) => (
                <div key={`desktop-${patient.id}`} className={styles.tableRow}>
                  <div className={styles.cell}>{patient.name}</div>
                  <div className={styles.cell}>{patient.patientId}</div>
                  <div className={styles.cell}>{renderTestSetTags(patient)}</div>
                  <div className={styles.cell}>
                    <button className={styles.playBtn} aria-label="Play" onClick={() => openPopup(String(patient.id))}>
                      <svg viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </button>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '2rem', textAlign: 'center' }}>ไม่พบข้อมูลผู้ป่วย</div>
              )}
            </div>
            {totalPages > 0 && (
              <div className={styles.pagination}>
                <button 
                  className={styles.pageBtn} 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  aria-label="First page"
                >
                  &laquo;
                </button>
                <button 
                  className={styles.pageBtn} 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  &lsaquo;
                </button>
                
                {getPageNumbers().map((page, index) => (
                  <button 
                    key={index}
                    className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''} ${page === '...' ? styles.dotsBtn : ''}`}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={page === '...'}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  className={styles.pageBtn}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  &rsaquo;
                </button>
                <button 
                  className={styles.pageBtn}
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Last page"
                >
                  &raquo;
                </button>
              </div>
            )}
          </div>

          {/* Mobile Grid View */}
          <div className={styles.mobileGrid}>
            {filteredPatients.length > 0 ? filteredPatients.slice(0, mobileVisibleCount).map((patient) => (
              <div key={`mobile-${patient.id}`} className={styles.patientCard}>
                <div className={styles.cardInfo}>
                  <span className={styles.patientName}>{patient.name}</span>
                  <span className={styles.patientId}>{patient.patientId}</span>
                </div>
                <button className={styles.cardPlayBtn} aria-label="Play" onClick={() => openPopup(String(patient.id))}>
                  <svg viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </button>
              </div>
            )) : (
              <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>ไม่พบข้อมูลผู้ป่วย</div>
            )}

            {mobileVisibleCount < filteredPatients.length && (
              <div ref={lastElementRef} style={{ padding: '1rem', width: '100%', gridColumn: '1 / -1' }}>
                <LoadingSpinner text="กำลังโหลดเพิ่มเติม..." size="small" svgSize={32} />
              </div>
            )}
          </div>
        </>
      )}

      <PatientStatsPopup 
        isOpen={isPopupOpen} 
        onClose={closePopup} 
        patientId={selectedPatientId} 
        categories={uniqueCategories}
        exerciseSets={uniqueExerciseSets}
      />
    </div>
  );
}
