"use client";

import { useState } from "react";
import styles from "./exercises.module.css";

// Mock data to match the UI state shown in the image
const initialExercises = [
  { id: 1, title: "Exercises1 Set" },
  { id: 2, title: "Exercises1 Set" },
  { id: 3, title: "Exercises1 Set" },
  { id: 4, title: "Exercises1 Set" },
  { id: 5, title: "Exercises1 Set" },
  { id: 6, title: "Exercises1 Set" },
];

export default function ManageExercisesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [exercises] = useState(initialExercises);

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.title}>จัดการแบบฝึกหัด</h1>
        <button className={styles.addButton}>
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
        {exercises.map((exercise) => (
          <div key={exercise.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{exercise.title}</h3>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
