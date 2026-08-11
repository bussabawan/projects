"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './matching.module.css';
import { getUserAssignedExercises } from './actions';

export default function MatchingCategoryPage() {
  const [activeTab, setActiveTab] = useState<'image' | 'word'>('image');
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<{exercises_id: number, exercises_name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      const data = await getUserAssignedExercises();
      setExercises(data);
      setLoading(false);
    };
    fetchExercises();
  }, []);

  const filteredExercises = exercises.filter(ex => 
    ex.exercises_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>จับคู่</h1>
        
        <div className={styles.controlsRow}>
          <div className={styles.toggleContainer}>
            <button 
              className={`${styles.toggleBtn} ${activeTab === 'image' ? styles.active : ''}`}
              onClick={() => setActiveTab('image')}
            >
              ภาพกับภาพ
            </button>
            <button 
              className={`${styles.toggleBtn} ${activeTab === 'word' ? styles.active : ''}`}
              onClick={() => setActiveTab('word')}
            >
              คำกับภาพ
            </button>
          </div>
          
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              placeholder="ค้นหา" 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </div>

      <div className={styles.categoriesGrid}>
        {loading ? (
          <div style={{ padding: '2rem', fontSize: '1.2rem', color: '#666' }}>กำลังโหลดข้อมูลแบบฝึกหัด...</div>
        ) : filteredExercises.length > 0 ? (
          filteredExercises.map((ex) => (
            <Link key={ex.exercises_id} href={`/user/games/matching/${ex.exercises_id}?type=${activeTab}`} className={styles.categoryBtn}>
              {ex.exercises_name}
            </Link>
          ))
        ) : (
          <div style={{ padding: '2rem', fontSize: '1.2rem', color: '#666' }}>
            {searchQuery ? 'ไม่พบแบบฝึกหัดที่ค้นหา' : 'ไม่มีแบบฝึกหัดที่ได้รับมอบหมาย'}
          </div>
        )}
      </div>
    </div>
  );
}
