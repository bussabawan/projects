"use client";

import React, { useEffect, useState } from 'react';
import styles from './patientStats.module.css';
import { PatientStatInfo } from '@/lib/models/patientStats';
import PatientStatsPopup from './components/PatientStatsPopup';

const extractCategory = (testSet?: string) => {
  if (!testSet) return '';
  const match = testSet.match(/หมวด(.*?)\s?เลเวล/);
  return match ? match[1].trim() : testSet;
};

const renderTestSetTag = (testSet?: string) => {
  const tagText = extractCategory(testSet);
  if (!tagText) return null;
  return <span className={styles.testSetTag}>{tagText}</span>;
};

export default function PatientStatsPage() {
  const [patients, setPatients] = useState<PatientStatInfo[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientStatInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>();

  const uniqueCategories = Array.from(new Set(
    patients.map(p => extractCategory(p.testSet)).filter(Boolean)
  ));

  const uniqueExerciseSets = Array.from(new Set(
    patients.map(p => p.testSet).filter(Boolean)
  ));

  const openPopup = (id: string) => {
    setSelectedPatientId(id);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedPatientId(undefined);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/patient-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch patient statistics');
        }
        const data = await response.json();
        setPatients(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    let result = patients;

    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(patient => 
        (patient.name && patient.name.toLowerCase().includes(lowerQuery)) || 
        (patient.patientId && patient.patientId.toLowerCase().includes(lowerQuery))
      );
    }

    setFilteredPatients(result);
  }, [searchQuery, patients]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
        <div style={{ textAlign: 'center', padding: '2rem' }}>กำลังโหลดข้อมูล...</div>
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
              {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                <div key={`desktop-${patient.id}`} className={styles.tableRow}>
                  <div className={styles.cell}>{patient.name}</div>
                  <div className={styles.cell}>{patient.patientId}</div>
                  <div className={styles.cell}>{renderTestSetTag(patient.testSet)}</div>
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
            <div className={styles.pagination}>
              <span className={styles.pageNav}>◀</span>
              <span className={`${styles.pageNumber} ${styles.activePage}`}>1</span>
              <span className={styles.pageNumber}>2</span>
              <span className={styles.pageNumber}>3</span>
              <span className={styles.pageNumber}>4</span>
              <span className={styles.pageNumber}>5...</span>
              <span className={styles.pageNav}>▶</span>
            </div>
          </div>

          {/* Mobile Grid View */}
          <div className={styles.mobileGrid}>
            {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
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
