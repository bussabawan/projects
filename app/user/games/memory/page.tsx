'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './memory.module.css';

import { getExercisesData } from './actions';

interface Exercise {
  exercises_id: number;
  exercises_name: string;
}

export default function MemoryCategoryPage() {
  const [activeTab, setActiveTab] = useState<'picture' | 'word'>('picture');
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const result = await getExercisesData();
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const filteredExercises = exercises.filter(ex => 
    ex.exercises_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ความจำ</h1>
      
      <div className={styles.controlsRow}>
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'picture' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('picture')}
          >
            ภาพกับภาพ
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'word' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('word')}
          >
            คำกับภาพ
          </button>
        </div>
        
        <form className={styles.searchContainer} onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="ค้นหา" 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchButton} aria-label="Search">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </form>
      </div>

      <div className={styles.categoriesGrid}>
        {isLoading ? (
          <div style={{ fontSize: '1.5rem', color: '#666', textAlign: 'center', width: '100%', padding: '2rem' }}>กำลังโหลดข้อมูล...</div>
        ) : filteredExercises.length > 0 ? (
          filteredExercises.map(ex => (
            <Link key={ex.exercises_id} href={`/user/games/memory/${ex.exercises_id}?mode=${activeTab}`} className={styles.categoryCard}>
              {ex.exercises_name}
            </Link>
          ))
        ) : (
          <div style={{ fontSize: '1.5rem', color: '#666', textAlign: 'center', width: '100%', padding: '2rem' }}>ไม่พบแบบฝึกหัด</div>
        )}
      </div>
    </div>
  );
}
