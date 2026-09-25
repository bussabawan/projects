'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Loader from '@/app/components/Loader/Loader';
import styles from './memory.module.css';

interface Exercise {
  exercises_id: number;
  exercises_name: string;
  thumbnail_id?: number;
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
          <div className={styles.titleWithIcon}>
            <div className={styles.titleIcon}>
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>🧠</span>
            </div>
            <h1 className={styles.title}>ความจำ</h1>
          </div>
          <Link href="/user/games" className={styles.backBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <span>ย้อนกลับ</span>
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
        {isLoading || searchQuery !== debouncedSearchQuery ? (
          <div style={{ gridColumn: '1 / -1', width: '100%', minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader text={searchQuery.trim() ? "กำลังค้นหาแบบฝึกหัด..." : "กำลังโหลดหมวดหมู่แบบฝึกหัด..."} />
          </div>
        ) : filteredExercises.length > 0 ? (
          filteredExercises.map((ex, index) => (
            <Link key={`${ex.exercises_id}-${index}`} href={`/user/games/memory/${ex.exercises_id}?mode=${activeTab}`} className={styles.categoryCard}>
              {ex.thumbnail_id && (
                <Image 
                  src={`/api/files/${ex.thumbnail_id}?type=image`} 
                  alt="" 
                  width={200}
                  height={200}
                  className={styles.categoryImage} 
                  loading="lazy"
                />
              )}
              <span className={styles.categoryText}>{ex.exercises_name}</span>
            </Link>
          ))
        ) : (
          <div style={{ padding: '4rem 2rem', fontSize: '1.2rem', color: '#94a3b8', gridColumn: '1 / -1', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            {searchQuery ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <path d="m14 14-6-6"></path>
                  <path d="m8 14 6-6"></path>
                </svg>
                <span>ไม่พบแบบฝึกหัดที่ค้นหา</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>ไม่มีแบบฝึกหัดที่ได้รับมอบหมาย</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
