"use client";

import styles from "./RestoreConfirmModal.module.css";
import { useScrollLock } from "@/app/hooks/useScrollLock";

interface RestoreConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RestoreConfirmModal({ 
  onConfirm, 
  onCancel 
}: RestoreConfirmModalProps) {
  useScrollLock(true);
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </div>
        <div className={styles.title}>พบข้อมูลเดิมในระบบ</div>
        <div className={styles.subtitle}>ต้องการกู้คืนข้อมูลที่เคยลบหรือไม่</div>
        <div className={styles.buttonRow}>
          <button className={styles.restoreBtn} onClick={onConfirm}>กู้คืนข้อมูล</button>
          <button className={styles.cancelBtn} onClick={onCancel}>ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

