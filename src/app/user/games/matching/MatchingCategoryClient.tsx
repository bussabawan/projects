"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Loader from '@/app/components/Loader/Loader';
import { PuzzleIcon } from '@/app/components/Icons';
import styles from './matching.module.css';
import { useDebounce } from '@/app/hooks/useDebounce';

interface Exercise {
  exercises_id: number;
  exercises_name: string;
  thumbnail_id?: number;
}

const preloadImages = (items: { thumbnail_id?: number }[]): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();

  const validItems = items.filter((item) => Boolean(item.thumbnail_id));
  if (validItems.length === 0) return Promise.resolve();

  const promises = validItems.map(
    (item) =>
      new Promise<void>((resolve) => {
        const img = new window.Image();
        let finished = false;
        const done = () => {
          if (!finished) {
            finished = true;
            resolve();
          }
        };

        img.onload = () => {
          if ('decode' in img && typeof img.decode === 'function') {
            img.decode().then(done).catch(done);
          } else {
            done();
          }
        };
        img.onerror = done;
        img.src = `/api/files/${item.thumbnail_id}?type=image`;
      })
  );

  const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 2500));
  return Promise.race([Promise.all(promises), timeoutPromise]).then(() => undefined);
};

export default function MatchingCategoryClient() {
  const [activeTab, setActiveTab] = useState<'image' | 'word'>('image');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedMode = sessionStorage.getItem('matchingActiveTab');
      if (savedMode === 'word') {
        setActiveTab('word');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (mode: 'image' | 'word') => {
    setActiveTab(mode);
    sessionStorage.setItem('matchingActiveTab', mode);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchExercises = async () => {
      try {
        const res = await fetch('/api/user/exercises');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && isMounted) {
          await preloadImages(json.data);
          if (isMounted) {
            setExercises(json.data);
          }
        } else if (!json.success) {
          console.error(json.error);
        }
      } catch (error) {
        console.error('Failed to fetch exercises:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchExercises();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredExercises = exercises.filter(ex => 
    ex.exercises_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Loader text="กำลังโหลดหมวดหมู่แบบฝึกหัด..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.titleWithIcon}>
            <div className={styles.titleIcon}>
              <PuzzleIcon size="2rem" style={{ color: '#10b981' }} />
            </div>
            <h1 className={styles.title}>จับคู่</h1>
          </div>
          <Link href="/user/games" className={styles.backBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <span>ย้อนกลับ</span>
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
              maxLength={200}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </div>

      <div className={styles.categoriesGrid}>
        {searchQuery !== debouncedSearchQuery ? (
          <div style={{ gridColumn: '1 / -1', width: '100%', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader text="กำลังค้นหาแบบฝึกหัด..." />
          </div>
        ) : filteredExercises.length > 0 ? (
          filteredExercises.map((ex) => (
            <Link key={ex.exercises_id} href={`/user/games/matching/${ex.exercises_id}?type=${activeTab}`} className={styles.categoryBtn}>
              {ex.thumbnail_id && (
                <Image 
                  src={`/api/files/${ex.thumbnail_id}?type=image`} 
                  alt="" 
                  width={200}
                  height={200}
                  className={styles.categoryImage} 
                  priority
                  unoptimized
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
