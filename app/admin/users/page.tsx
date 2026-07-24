"use client";

import { useState, useEffect, useCallback } from "react";
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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const role = activeTab === "patient" ? 1 : 2;
      const res = await fetch(`/api/admin/users?role=${role}&page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(debouncedSearchQuery)}`);
      const result = await res.json();
      
      if (result.success) {
        setUsers(result.data);
        setTotalPages(result.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, itemsPerPage, debouncedSearchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const handleTabChange = (tab: "patient" | "staff") => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery("");
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
          fetchUsers();
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
    fetchUsers(); // Refresh data
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

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.title}>จัดการผู้ป่วย</h1>
        <button className={styles.addButton} onClick={handleAdd}>
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
            className={styles.searchInput} 
            placeholder="ค้นหา" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>รหัส{activeTab === "patient" ? "ผู้ป่วย" : "เจ้าหน้าที่"}</div>
          <div>ชื่อ - นามสกุล</div>
          <div>{activeTab === "patient" ? "ชุดแบบฝึกหัด" : "บทบาท"}</div>
          <div>วันที่แก้ไข</div>
          <div>จัดการ</div>
        </div>
        
        <div className={styles.tableBody}>
          {loading ? (
            <div className={styles.loadingState}>กำลังโหลดข้อมูล...</div>
          ) : users.length === 0 ? (
            <div className={styles.emptyState}>ไม่พบข้อมูล</div>
          ) : (
            users.map((user) => (
              <div className={styles.tableRow} key={user.user_id}>
                <div className={styles.cell}>{user.user_id}</div>
                <div className={styles.cell}>{user.full_name}</div>
                <div className={styles.cell}>
                  {activeTab === "patient" ? (
                    user.exercises_name ? (
                      <span className={styles.tag}>{user.exercises_name}</span>
                    ) : (
                      "-"
                    )
                  ) : (
                    "เจ้าหน้าที่"
                  )}
                </div>
                <div className={styles.cell}>{formatDate(user.update_time)}</div>
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
            ))
          )}
        </div>
      </div>

      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.pageBtn} 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            &laquo;
          </button>
          <button 
            className={styles.pageBtn} 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            &lsaquo;
          </button>
          
          {/* Simple pagination logic for demo */}
          {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
            let pageNum = currentPage;
            if (currentPage <= 3) pageNum = idx + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + idx;
            else pageNum = currentPage - 2 + idx;
            
            if (pageNum > 0 && pageNum <= totalPages) {
              return (
                <button 
                  key={pageNum}
                  className={`${styles.pageBtn} ${currentPage === pageNum ? styles.activePage : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            }
            return null;
          })}

          <button 
            className={styles.pageBtn} 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            &rsaquo;
          </button>
          <button 
            className={styles.pageBtn} 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            &raquo;
          </button>
        </div>
      )}

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
