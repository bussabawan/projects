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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const filteredExercises = exercises.filter(ex => 
    ex.exercises_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ความจำ</h1>
      
      <div className={styles.controlsRow}>
        <div className={`${styles.tabsContainer} ${activeTab === 'word' ? styles.tabWord : styles.tabImage}`}>
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
          <div style={{ fontSize: '1.5rem', color: '#666', textAlign: 'center', width: '100%', padding: '2rem' }}>ไม่พบแบบฝึกหัด</div>
        )}
      </div>
    </div>
  );
}
