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

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [allImages, setAllImages] = useState<any[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  const [currentExerciseName, setCurrentExerciseName] = useState<string>("");
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

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

  const handleAddExercise = async () => {
    if (!newExerciseName.trim()) return;
    setIsAddingExercise(true);
    setAddError(null);
    try {
      const res = await fetch('/api/admin/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newExerciseName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setNewExerciseName("");
        window.location.reload();
      } else {
        setAddError(data.error || 'เกิดข้อผิดพลาดในการเพิ่มชุดแบบฝึกหัด');
      }
    } catch (err) {
      setAddError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsAddingExercise(false);
    }
  };

  const openImageModal = async (exerciseName: string) => {
    setCurrentExerciseName(exerciseName);
    setIsImageModalOpen(true);
    setIsLoadingImages(true);
    try {
      const resImgs = await fetch(`/api/admin/images?limit=100&search=${encodeURIComponent(imageSearchQuery)}`);
      const dataImgs = await resImgs.json();
      if (dataImgs.success) {
        setAllImages(dataImgs.data);
      }
      
      const resSelected = await fetch(`/api/admin/exercises/${encodeURIComponent(exerciseName)}/images`);
      const dataSelected = await resSelected.json();
      if (dataSelected.success) {
        setSelectedImageIds(dataSelected.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleSaveImages = async () => {
    if (!currentExerciseName) return;
    setIsSavingImages(true);
    try {
      const res = await fetch(`/api/admin/exercises/${encodeURIComponent(currentExerciseName)}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: selectedImageIds })
      });
      const data = await res.json();
      if (data.success) {
        setIsImageModalOpen(false);
        window.location.reload();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการบันทึกรูปภาพ');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSavingImages(false);
    }
  };

  const toggleImageSelection = (id: number) => {
    setSelectedImageIds(prev => 
      prev.includes(id) ? prev.filter(imgId => imgId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (isImageModalOpen) {
      const fetchFilteredImages = async () => {
        try {
          const res = await fetch(`/api/admin/images?limit=100&search=${encodeURIComponent(imageSearchQuery)}`);
          const data = await res.json();
          if (data.success) {
            setAllImages(data.data);
          }
        } catch (err) {
          console.error(err);
        }
      };
      
      const timer = setTimeout(() => {
        fetchFilteredImages();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [imageSearchQuery, isImageModalOpen]);

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
        <button className={`${styles.addButton} ${styles.desktopAddBtn}`} onClick={() => {
          setIsAddModalOpen(true);
          setAddError(null);
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className={styles.addText}>เพิ่ม</span>
        </button>
      </div>

      <div className={styles.controlsRow}>
        <button className={styles.mobileAddBtn} onClick={() => {
          setIsAddModalOpen(true);
          setAddError(null);
        }}>
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
                  
                  <button className={styles.manageImagesBtn} onClick={() => openImageModal(exercise.exercises_name)}>
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

      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>เพิ่มชุดแบบฝึกหัด</h2>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ชื่อชุดแบบฝึกหัด</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={newExerciseName}
                  onChange={(e) => {
                    setNewExerciseName(e.target.value);
                    if (addError) setAddError(null);
                  }}
                />
                {addError && <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>{addError}</p>}
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.btnSave}
                  onClick={handleAddExercise}
                  disabled={isAddingExercise}
                >
                  {isAddingExercise ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button
                  className={styles.btnCancel}
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewExerciseName("");
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isImageModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.largeModal}`}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>เลือกรูปภาพสำหรับชุดแบบฝึกหัด</h2>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.imageSearchRow}>
                <div className={styles.imageSearchContainer}>
                  <input 
                    type="text" 
                    placeholder="ค้นหา" 
                    className={styles.imageSearchInput}
                    value={imageSearchQuery}
                    onChange={(e) => setImageSearchQuery(e.target.value)}
                  />
                  <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
              </div>
              
              <div className={styles.imageGrid}>
                {isLoadingImages ? (
                  <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>กำลังโหลดรูปภาพ...</p>
                ) : allImages.length === 0 ? (
                  <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>ไม่พบรูปภาพ</p>
                ) : (
                  allImages.map((img) => (
                    <label key={img.id} className={styles.imageGridItem}>
                      <input 
                        type="checkbox" 
                        className={styles.imageCheckbox} 
                        checked={selectedImageIds.includes(img.id)}
                        onChange={() => toggleImageSelection(img.id)}
                      />
                      <div className={styles.imageIconPlaceholder}>
                        {img.imageUrl ? (
                          <img 
                            src={img.imageUrl.startsWith('/') ? img.imageUrl : `/uploads/${img.imageUrl}`} 
                            alt={img.title} 
                            loading="lazy"
                            decoding="async"
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        )}
                      </div>
                      <span className={styles.imageItemText}>{img.title}</span>
                    </label>
                  ))
                )}
              </div>
              
              <div className={styles.modalFooter}>
                <button
                  className={styles.btnSave}
                  onClick={handleSaveImages}
                  disabled={isSavingImages}
                >
                  {isSavingImages ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button
                  className={styles.btnCancel}
                  onClick={() => setIsImageModalOpen(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
