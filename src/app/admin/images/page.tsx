"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Loader from "@/app/components/Loader/Loader";
import styles from "./images.module.css";
import ImageFormModal from "./components/ImageFormModal";
import DeleteConfirmModal from "@/app/components/Admin/DeleteConfirmModal";
import RestoreConfirmModal from "@/app/components/Admin/RestoreConfirmModal";
import { useDebounce } from '@/app/hooks/useDebounce';

function CardImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setError(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [src]);

  if (!src || error) {
    return (
      <svg width="50%" height="50%" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    );
  }

  return <Image src={src.startsWith('/') || src.startsWith('blob:') ? src : `/api/uploads/${src}`} alt={alt} width={400} height={400} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setError(true)} unoptimized />;
}

interface ImageData {
  id: number;
  title: string;
  imageUrl: string;
  audioUrl?: string;
  audioTitle?: string;
  audioGen?: number;
}

export default function ManageImagesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 15;
  const isLoadMoreRef = useRef(false);
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchImages = useCallback(async () => {
    const isLoadMore = isLoadMoreRef.current;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const res = await fetch(`/api/admin/images?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(debouncedSearchQuery)}`, {
        cache: 'no-store',
        signal: abortController.signal
      });
      const json = await res.json();
      if (json.success) {
        const newImages: ImageData[] = json.data;
        const preloadPromises: Promise<void>[] = [];

        newImages.forEach(img => {
          if (img.imageUrl) {
            preloadPromises.push(new Promise((resolve) => {
              const fullImageUrl = img.imageUrl.startsWith('/') || img.imageUrl.startsWith('blob:') ? img.imageUrl : `/api/uploads/${img.imageUrl}`;
              const image = new window.Image();
              image.onload = () => resolve();
              image.onerror = () => resolve();
              image.src = fullImageUrl;
            }));
          }
          if (img.audioUrl) {
            preloadPromises.push(new Promise((resolve) => {
              const fullAudioUrl = img.audioUrl!.startsWith('/') || img.audioUrl!.startsWith('blob:') ? img.audioUrl! : `/api/uploads/${img.audioUrl}`;
              if (!audioCache.current[fullAudioUrl]) {
                const audio = new window.Audio(fullAudioUrl);
                audio.preload = 'auto';
                audioCache.current[fullAudioUrl] = audio;
                fetch(fullAudioUrl)
                  .then(() => resolve())
                  .catch(() => resolve());
              } else {
                resolve();
              }
            }));
          }
        });

        // Wait up to 8 seconds for all media to cache
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 8000));
        await Promise.race([Promise.all(preloadPromises), timeoutPromise]);

        if (abortController.signal.aborted) return;

        if (isLoadMore) {
          setImages(prev => {
            // Prevent duplicates when appending
            const existingIds = new Set(prev.map(p => p.id));
            const filteredNew = json.data.filter((img: ImageData) => !existingIds.has(img.id));
            return [...prev, ...filteredNew];
          });
        } else {
          setImages(json.data);
        }
        setTotalPages(json.totalPages || 1);
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') return;
      console.error("Failed to fetch images", err);
    } finally {
      if (!abortController.signal.aborted) {
        if (isLoadMore) {
          setLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
      isLoadMoreRef.current = false;
    }
  }, [currentPage, itemsPerPage, debouncedSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchImages();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchImages]);

  // Debounce search query handled by hook
  // Reset to page 1 when the debounced search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 0);
    return () => clearTimeout(timer);
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

  const [editingImage, setEditingImage] = useState<ImageData | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [duplicateToRestore, setDuplicateToRestore] = useState<{ id: number; data: Record<string, unknown> } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAdd = () => {
    setEditingImage(null);
    setIsModalOpen(true);
  };

  const handleEdit = (img: ImageData) => {
    setEditingImage(img);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingImageId(id);
  };

  const confirmDelete = async () => {
    if (deletingImageId === null) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/images/${deletingImageId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert("ลบข้อมูลไม่สำเร็จ");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleModalSave = async (data: Record<string, unknown>) => {
    setIsProcessing(true);
    try {
      const isEdit = !!editingImage;
      const url = isEdit ? `/api/admin/images/${editingImage.id}` : "/api/admin/images";
      const method = isEdit ? "PUT" : "POST";
      
      const payload = {
        title: data.imageName,
        imageUrl: data.imageUrl,
        audioUrl: data.audioUrl,
        audioTitle: data.speechText || "",
        audioGen: data.useAutoSpeech ? 1 : 0
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setIsModalOpen(false);
        window.location.reload();
      } else if (result.isDuplicateDeleted) {
        setDuplicateToRestore({ id: result.duplicateId, data: payload });
        setIsProcessing(false);
      } else {
        alert(result.error || "บันทึกข้อมูลไม่สำเร็จ");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึก");
      setIsProcessing(false);
    }
  };

  const confirmRestore = async () => {
    if (!duplicateToRestore) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/images/${duplicateToRestore.id}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateToRestore.data)
      });
      const result = await res.json();
      if (result.success) {
        setIsModalOpen(false);
        setEditingImage(null);
        window.location.reload();
      } else {
        alert(result.error || "กู้คืนข้อมูลไม่สำเร็จ");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการกู้คืน");
      setIsProcessing(false);
    } finally {
      setDuplicateToRestore(null);
    }
  };

  const playAudio = (audioUrl?: string) => {
    if (!audioUrl) {
      alert("ไม่มีไฟล์เสียง");
      return;
    }
    const fullAudioUrl = audioUrl.startsWith('/') || audioUrl.startsWith('blob:') ? audioUrl : `/api/uploads/${audioUrl}`;
    
    let audio = audioCache.current[fullAudioUrl];
    if (!audio) {
      audio = new Audio(fullAudioUrl);
      audio.preload = 'auto';
      audioCache.current[fullAudioUrl] = audio;
    }
    
    const setAudioTime = (el: HTMLAudioElement) => {
      el.currentTime = 0;
    };
    setAudioTime(audio);
    audio.play().catch(e => {
      console.error(e);
      alert("ไม่สามารถเล่นเสียงได้");
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.title}>จัดการรูปภาพ</h1>
        <button className={`${styles.addButton} ${styles.desktopAddBtn}`} onClick={handleAdd}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          เพิ่ม
        </button>
      </div>

      <div className={styles.controlsRow}>
        <button className={styles.mobileAddBtn} onClick={handleAdd}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5b5bb2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <div className={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="ค้นหา..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      <div className={styles.grid}>
        {isLoading || searchQuery !== debouncedSearchQuery ? (
          <div style={{ padding: '4rem 0', minHeight: '350px', gridColumn: '1 / -1', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader text={searchQuery.trim() ? "กำลังค้นหารูปภาพ..." : "กำลังโหลดรูปภาพ..."} />
          </div>
        ) : images.length === 0 ? (
          <div style={{ 
            gridColumn: '1 / -1', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '5rem 0',
            color: '#8a8a9a',
            gap: '0.5rem',
            textAlign: 'center'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '1rem' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="9" y1="9" x2="13" y2="13"></line>
              <line x1="13" y1="9" x2="9" y2="13"></line>
            </svg>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#6b6b7b' }}>ไม่พบรูปภาพที่คุณค้นหา</div>
            <div style={{ fontSize: '0.95rem', opacity: 0.8 }}>ลองเปลี่ยนคำค้นหาใหม่ หรือกดเพิ่มรูปภาพเข้าระบบ</div>
          </div>
        ) : (
          images.map((img) => (
            <div key={img.id} className={styles.card}>
              <div className={styles.imageContainer}>
                <CardImage src={img.imageUrl} alt={img.title} />
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardTitle}>{img.title}</div>
                
                <div className={styles.cardActions}>
                  <button 
                    className={styles.actionBtn} 
                    title="เล่นเสียง (Play sound)"
                    onClick={() => playAudio(img.audioUrl)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    </svg>
                  </button>
                
                  <button className={styles.actionBtn} onClick={() => handleEdit(img)} title="แก้ไข (Edit)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  
                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteClick(img.id)} title="ลบ (Delete)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Intersection Observer Target */}
      {!isLoading && searchQuery === debouncedSearchQuery && currentPage < totalPages && (
        <div ref={lastElementRef} className={styles.loadMoreTarget}>
          {loadingMore && (
            <div style={{ width: '100%', padding: '1rem 0' }}>
              <Loader size="1.5px" text="กำลังโหลดเพิ่มเติม..." />
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <ImageFormModal 
          image={editingImage}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
        />
      )}

      {deletingImageId !== null && (
        <DeleteConfirmModal 
          onConfirm={confirmDelete}
          onCancel={() => setDeletingImageId(null)}
        />
      )}

      {duplicateToRestore !== null && (
        <RestoreConfirmModal 
          onConfirm={confirmRestore}
          onCancel={() => setDuplicateToRestore(null)}
        />
      )}

      {isProcessing && <Loader fullScreen text="กำลังดำเนินการ..." />}
    </div>
  );
}
