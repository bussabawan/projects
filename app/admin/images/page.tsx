"use client";

import { useState } from "react";
import styles from "./images.module.css";

// Temporary mock data to match the design
const mockImages = [
  { id: 1, title: "ร่างกาย", imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=body&backgroundColor=transparent" },
  { id: 2, title: "ของใช้", imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=items&backgroundColor=transparent" },
];

export default function ManageImagesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleAdd = () => {
    // Add logic here later
    alert("เพิ่มรูปภาพ (Add Image)");
  };

  const handleEdit = (id: number) => {
    // Edit logic here later
    alert(`แก้ไขรูปภาพ (Edit Image) ID: ${id}`);
  };

  const handleDelete = (id: number) => {
    // Delete logic here later
    if (confirm("ยืนยันการลบรูปภาพ? (Confirm delete?)")) {
      alert(`ลบรูปภาพ (Delete Image) ID: ${id}`);
    }
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
        {mockImages.map((img) => (
          <div key={img.id} className={styles.card}>
            <div className={styles.imageContainer}>
              <img src={img.imageUrl} alt={img.title} />
            </div>
            <div className={styles.cardTitle}>{img.title}</div>
            
            <div className={styles.cardActions}>
              <button className={styles.actionBtn} title="เล่นเสียง (Play sound)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              </button>
              
              <button className={styles.actionBtn} onClick={() => handleEdit(img.id)} title="แก้ไข (Edit)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              
              <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(img.id)} title="ลบ (Delete)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
