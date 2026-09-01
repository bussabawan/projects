'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './memory.module.css';


interface Exercise {
  exercises_id: number;
  exercises_name: string;
}

export default function MemoryCategoryClient() {
  const [activeTab, setActiveTab] = useState<'picture' | 'word'>('picture');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedTab = sessionStorage.getItem('memoryActiveTab');
    if (savedTab === 'picture' || savedTab === 'word') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(savedTab as 'picture' | 'word');
    }
  }, []);

  const handleTabChange = (tab: 'picture' | 'word') => {
    setActiveTab(tab);
    sessionStorage.setItem('memoryActiveTab', tab);
  };

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await fetch('/api/user/games/memory');
        const result = await res.json();
        if (result.success && result.data) {
          setExercises(result.data);
        }
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExercises();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);



  const filteredExercises = exercises.filter(ex => 
    ex.exercises_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>ความจำ</h1>
          <Link href="/user/games" className={styles.backBtn}>
            ย้อนกลับ
          </Link>
        </div>
        
        <div className={styles.controlsRow}>
          <div className={`${styles.tabsContainer} ${activeTab === 'word' ? styles.tabWord : styles.tabImage}`}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'picture' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('picture')}
            >
              ภาพกับภาพ
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'word' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('word')}
            >
              คำกับภาพ
            </button>
          </div>
          
          <div className={styles.searchContainer}>
            <input 
              id="searchExercises"
              name="searchExercises"
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
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}></div>
          ))
        ) : filteredExercises.length > 0 ? (
          filteredExercises.map((ex, index) => (
            <Link key={`${ex.exercises_id}-${index}`} href={`/user/games/memory/${ex.exercises_id}?mode=${activeTab}`} className={styles.categoryCard}>
              <span className={styles.cardText}>{ex.exercises_name}</span>
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
