"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./users.module.css";
import UserFormModal from "./components/UserFormModal";

interface User {
  user_id: number;
  user_name: string;
  full_name: string;
  role: number;
  update_time: string;
  exercises_id?: number | null;
  exercises_name?: string | null;
}

export default function ManageUsersPage() {
  const [activeTab, setActiveTab] = useState<"patient" | "staff">("patient");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const isLoadMoreRef = useRef(false);

  const fetchUsers = useCallback(async () => {
    const isLoadMore = isLoadMoreRef.current;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const role = activeTab === "patient" ? 1 : 2;
      const res = await fetch(`/api/admin/users?role=${role}&page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(debouncedSearchQuery)}`);
      const result = await res.json();
      
      if (result.success) {
        if (isLoadMore) {
          setUsers(prev => [...prev, ...result.data]);
        } else {
          setUsers(result.data);
        }
        setTotalPages(result.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [activeTab, currentPage, itemsPerPage, debouncedSearchQuery]);

  useEffect(() => {
    fetchUsers();
    isLoadMoreRef.current = false;
  }, [fetchUsers]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when the debounced search term changes or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, activeTab]);

  // Infinite Scroll Observer for Mobile
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && currentPage < totalPages) {
        const isMobileLayout = window.matchMedia('(max-width: 768px), (max-width: 950px) and (max-height: 500px)').matches;
        if (isMobileLayout) {
          isLoadMoreRef.current = true;
          setCurrentPage(prev => prev + 1);
        }
      }
    }, { rootMargin: '100px' });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, currentPage, totalPages]);

  const handleTabChange = (tab: "patient" | "staff") => {
    setActiveTab(tab);
    isLoadMoreRef.current = false;
    setCurrentPage(1);
    setSearchQuery("");
  };

  const handlePageChange = (page: number) => {
    isLoadMoreRef.current = false;
    setCurrentPage(page);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: number) => {
    if (confirm("คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?")) {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
          // Remove from local state to preserve infinite scroll items
          setUsers(prev => prev.filter(u => u.user_id !== userId));
        } else {
          alert("ลบข้อมูลไม่สำเร็จ: " + result.error);
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleModalSave = () => {
    setIsModalOpen(false);
    if (currentPage === 1) {
      isLoadMoreRef.current = false;
      fetchUsers();
    } else {
      isLoadMoreRef.current = false;
      setCurrentPage(1);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPageNumbers = () => {
    const delta = 2; // how many pages around current page
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.title}>จัดการผู้ใช้</h1>
        <button className={`${styles.addButton} ${styles.desktopAddBtn}`} onClick={handleAdd}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          เพิ่ม
        </button>
      </div>

      <div className={styles.controlsRow}>
        <div className={styles.tabSwitcher}>
          <button 
            className={`${styles.tabBtn} ${activeTab === "patient" ? styles.active : ""}`}
            onClick={() => handleTabChange("patient")}
          >
            ผู้ป่วย
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === "staff" ? styles.active : ""}`}
            onClick={() => handleTabChange("staff")}
          >
            เจ้าหน้าที่
          </button>
        </div>

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
      
      {/* Mobile Add Button */}
      <div className={styles.mobileAddContainer}>
        <button className={`${styles.addButton} ${styles.mobileAddBtn}`} onClick={handleAdd}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      <div className={styles.tableCard}>
        {activeTab === "patient" ? (
          <div className={styles.tableHeaderPatient}>
            <div>รหัสผู้ป่วย</div>
            <div>ชื่อ - นามสกุล</div>
            <div>ชุดแบบฝึกหัด</div>
            <div>วันที่แก้ไข</div>
            <div>จัดการ</div>
          </div>
        ) : (
          <div className={styles.tableHeaderStaff}>
            <div>ชื่อ - นามสกุล</div>
            <div>อีเมล (บัญชี Google)</div>
            <div>วันที่แก้ไข</div>
            <div>จัดการ</div>
          </div>
        )}
        
        <div className={styles.tableBody}>
          {loading && users.length === 0 ? (
            <div className={styles.loadingState}>กำลังโหลดข้อมูล...</div>
          ) : users.length === 0 ? (
            <div className={styles.emptyState}>ไม่พบข้อมูล</div>
          ) : (
            users.map((user) => (
              activeTab === "patient" ? (
                <div className={styles.tableRowPatient} key={user.user_id}>
                  {/* Desktop cells */}
                  <div className={`${styles.cell} ${styles.desktopOnly}`}>{user.user_id}</div>
                  <div className={`${styles.cell} ${styles.desktopOnly}`}>{user.full_name}</div>
                  <div className={`${styles.cell} ${styles.desktopOnly}`}>
                    {user.exercises_name ? (
                      <div className={styles.tagsContainer}>
                        {user.exercises_name.split('||').map((exName, idx) => (
                          <span key={idx} className={styles.tag}>{exName}</span>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div className={`${styles.cell} ${styles.desktopOnly}`}>{formatDate(user.update_time)}</div>

                  {/* Mobile cell */}
                  <div className={`${styles.cell} ${styles.mobileOnly}`}>
                    <div className={styles.mobileCardInfo}>
                      <div className={styles.mobileName}>{user.full_name}</div>
                      <div className={styles.mobileId}>{user.user_id}</div>
                    </div>
                  </div>

                  <div className={styles.actionCell}>
                    <button className={styles.actionBtn} onClick={() => handleEdit(user)} title="แก้ไข">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(user.user_id)} title="ลบ">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.tableRowStaff} key={user.user_id}>
                  {/* Desktop cells */}
                  <div className={`${styles.cell} ${styles.desktopOnly}`}>{user.full_name}</div>
                  <div className={`${styles.cell} ${styles.desktopOnly}`}>{user.user_name}</div>
                  <div className={`${styles.cell} ${styles.desktopOnly}`}>{formatDate(user.update_time)}</div>

                  {/* Mobile cell */}
                  <div className={`${styles.cell} ${styles.mobileOnly}`}>
                    <div className={styles.mobileCardInfo}>
                      <div className={styles.mobileName}>{user.full_name}</div>
                    </div>
                  </div>

                  <div className={styles.actionCell}>
                    <button className={styles.actionBtn} onClick={() => handleEdit(user)} title="แก้ไข">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(user.user_id)} title="ลบ">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              )
            ))
          )}

          {/* Desktop Pagination */}
          {!loading && totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(1)}
              >
                &laquo;
              </button>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                &lsaquo;
              </button>
              
              {getPageNumbers().map((page, index) => (
                <button 
                  key={index}
                  className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ""} ${page === "..." ? styles.dots : ""}`}
                  onClick={() => page !== "..." && handlePageChange(page as number)}
                  disabled={page === "..."}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                &rsaquo;
              </button>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(totalPages)}
              >
                &raquo;
              </button>
            </div>
          )}
        </div>
        
        {/* Intersection Observer Target */}
        {!loading && currentPage < totalPages && (
          <div ref={lastElementRef} className={styles.loadMoreTarget}>
            {loadingMore && <div className={styles.loadingMoreText}>กำลังโหลด...</div>}
          </div>
        )}
      </div>



      {isModalOpen && (
        <UserFormModal 
          user={editingUser} 
          role={activeTab === "patient" ? 1 : 2}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
