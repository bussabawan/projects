"use client";

import styles from "./DeleteConfirmModal.module.css";

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
}

export default function DeleteConfirmModal({ 
  onConfirm, 
  onCancel, 
  title = "ยืนยันการลบข้อมูลรูปภาพ" 
}: DeleteConfirmModalProps) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </div>
        <div className={styles.title}>{title}</div>
        <div className={styles.buttonRow}>
          <button className={styles.confirmBtn} onClick={onConfirm}>ตกลง</button>
          <button className={styles.cancelBtn} onClick={onCancel}>ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}
