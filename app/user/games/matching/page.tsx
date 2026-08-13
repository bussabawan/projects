"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import styles from './matching.module.css';
import { getUserAssignedExercises } from './actions';

function MatchingCategoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const initialTab = (searchParams.get('type') as 'image' | 'word') || 'image';
  const [activeTab, setActiveTab] = useState<'image' | 'word'>(initialTab);
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

  const handleTabChange = (tab: 'image' | 'word') => {
    setActiveTab(tab);
    router.replace(`${pathname}?type=${tab}`, { scroll: false });
  };

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
        {loading ? (
          <>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={styles.skeletonCard}></div>
            ))}
          </>
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

export default function MatchingCategoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <MatchingCategoryContent />
    </Suspense>
  );
}
