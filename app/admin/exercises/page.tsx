"use client";

import { useState, useEffect } from "react";
import styles from "./exercises.module.css";

interface Exercise {
  exercises_id: number;
  exercises_name: string;
}

export default function ManageExercisesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/exercises');
      const data = await res.json();
      if (data.success) {
        setExercises(data.data);
      } else {
        setError(data.error || 'Failed to fetch exercises');
      }
    } catch (err) {
      setError('An error occurred while fetching exercises');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExercises = exercises.filter(ex => 
    ex.exercises_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.title}>จัดการแบบฝึกหัด</h1>
        <button className={`${styles.addButton} ${styles.desktopAddBtn}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className={styles.addText}>เพิ่ม</span>
        </button>
      </div>

      <div className={styles.controlsRow}>
        <button className={styles.mobileAddBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7f6e99" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <div className={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="ค้นหา" 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      <div className={styles.grid}>
        {isLoading ? (
          <p>กำลังโหลด...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : filteredExercises.length === 0 ? (
          <p>ไม่พบข้อมูลแบบฝึกหัด</p>
        ) : (
          filteredExercises.map((exercise) => (
            <div key={exercise.exercises_id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{exercise.exercises_name}</h3>
                <div className={styles.cardActions}>
                  <button className={styles.iconBtn} title="แก้ไข (Edit)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button className={`${styles.iconBtn} ${styles.deleteBtn}`} title="ลบ (Delete)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
              
              <button className={styles.manageImagesBtn}>
                จัดการรูป
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
