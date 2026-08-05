"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner/LoadingSpinner";
import styles from "./exercises.module.css";

interface Exercise {
  exercises_id: number;
  exercises_name: string;
}

export default function ManageExercisesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;
  const isLoadMoreRef = useRef(false);

  const fetchExercises = useCallback(async () => {
    const isLoadMore = isLoadMoreRef.current;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const res = await fetch(`/api/admin/exercises?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(debouncedSearchQuery)}`);
      const data = await res.json();
      if (data.success) {
        if (isLoadMore) {
          setExercises(prev => [...prev, ...data.data]);
        } else {
          setExercises(data.data);
        }
        setTotalPages(data.total ? Math.ceil(data.total / itemsPerPage) : 1);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch exercises');
      }
    } catch (err) {
      setError('An error occurred while fetching exercises');
      console.error(err);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [currentPage, itemsPerPage, debouncedSearchQuery]);

  useEffect(() => {
    fetchExercises();
    isLoadMoreRef.current = false;
  }, [fetchExercises]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when the debounced search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Infinite Scroll Observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && currentPage < totalPages) {
        isLoadMoreRef.current = true;
        setCurrentPage(prev => prev + 1);
      }
    }, { rootMargin: '200px' });
    
    if (node) observer.current.observe(node);
  }, [isLoading, loadingMore, currentPage, totalPages]);

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
          <LoadingSpinner />
        ) : error ? (
          <p style={{ color: 'red', gridColumn: '1 / -1', textAlign: 'center' }}>{error}</p>
        ) : exercises.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>ไม่พบข้อมูลแบบฝึกหัด</p>
        ) : (
          <>
            {exercises.map((exercise, index) => {
              const isLastElement = index === exercises.length - 1;
              return (
                <div 
                  key={exercise.exercises_id} 
                  className={styles.card}
                  ref={isLastElement ? lastElementRef : null}
                >
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
              );
            })}
            {loadingMore && (
              <LoadingSpinner text="กำลังโหลดเพิ่มเติม..." size="small" svgSize={32} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
