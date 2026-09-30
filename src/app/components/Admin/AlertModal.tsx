"use client";

import styles from "./AlertModal.module.css";
import { useScrollLock } from "@/app/hooks/useScrollLock";

interface AlertModalProps {
  onConfirm: () => void;
  title: string;
}

export default function AlertModal({ 
  onConfirm, 
  title 
}: AlertModalProps) {
  useScrollLock(true);
  return (
    <div className={styles.overlay} onClick={onConfirm}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <div className={styles.title}>{title}</div>
        <div className={styles.buttonRow}>
          <button className={styles.confirmBtn} onClick={onConfirm}>ตกลง</button>
        </div>
      </div>
    </div>
  );
}
