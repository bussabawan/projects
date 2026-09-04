"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Loader from '@/app/components/Loader/Loader';
import styles from './matching.module.css';


import { useDebounce } from '@/app/hooks/useDebounce';

export default function MatchingCategoryClient() {
  const [activeTab, setActiveTab] = useState<'image' | 'word'>('image');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [exercises, setExercises] = useState<{exercises_id: number, exercises_name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedMode = sessionStorage.getItem('matchingActiveTab');
    if (savedMode === 'word') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('word');
    }
  }, []);

  const handleTabChange = (mode: 'image' | 'word') => {
    setActiveTab(mode);
    sessionStorage.setItem('matchingActiveTab', mode);
  };

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await fetch('/api/user/exercises');
        const json = await res.json();
        if (json.success) {
          setExercises(json.data);
        } else {
          console.error(json.error);
        }
      } catch (error) {
        console.error('Failed to fetch exercises:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  const filteredExercises = exercises.filter(ex => 
    ex.exercises_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>จับคู่</h1>
          <Link href="/user/games" className={styles.backBtn}>
            ย้อนกลับ
          </Link>
        </div>
        <div className={styles.controlsRow}>
          <div className={`${styles.toggleContainer} ${activeTab === 'word' ? styles.toggleWord : styles.toggleImage}`}>
            <button 
              className={`${styles.toggleBtn} ${activeTab === 'image' ? styles.active : ''}`}
              onClick={() => handleTabChange('image')}
            >
              ภาพกับภาพ
            </button>
            <button 
              className={`${styles.toggleBtn} ${activeTab === 'word' ? styles.active : ''}`}
              onClick={() => handleTabChange('word')}
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
        {loading || searchQuery !== debouncedSearchQuery ? (
          <div style={{ gridColumn: '1 / -1', width: '100%', minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader text={searchQuery.trim() ? "กำลังค้นหาแบบฝึกหัด..." : "กำลังโหลดหมวดหมู่แบบฝึกหัด..."} />
          </div>
        ) : filteredExercises.length > 0 ? (
          filteredExercises.map((ex) => (
            <Link key={ex.exercises_id} href={`/user/games/matching/${ex.exercises_id}?type=${activeTab}`} className={styles.categoryBtn}>
              {ex.exercises_name}
            </Link>
          ))
        ) : (
          <div style={{ padding: '2rem', fontSize: '1.2rem', color: '#666', gridColumn: '1 / -1', textAlign: 'center' }}>
            {searchQuery ? 'ไม่พบแบบฝึกหัดที่ค้นหา' : 'ไม่มีแบบฝึกหัดที่ได้รับมอบหมาย'}
          </div>
        )}
      </div>
    </div>
  );
}
