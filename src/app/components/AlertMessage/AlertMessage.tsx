import React from 'react';
import styles from './AlertMessage.module.css';

interface AlertMessageProps {
  type: 'success' | 'error' | 'confirm';
  line1?: string;
  line2?: string;
  show?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function AlertMessage({ 
  type, 
  line1,
  line2,
  show = true,
  onConfirm,
  onCancel
}: AlertMessageProps) {
  
  if (!show) return null;

  // Set default messages based on type if not provided
  const defaultLine1 = type === 'success' ? 'คำตอบถูกต้อง' : type === 'error' ? 'คำตอบไม่ถูกต้อง' : 'ยืนยันการดำเนินการ?';
  const defaultLine2 = type === 'success' ? 'กำลังไปข้อถัดไป...' : type === 'error' ? 'กรุณาลองใหม่' : '';

  const displayLine1 = line1 || defaultLine1;
  const displayLine2 = line2 !== undefined ? line2 : defaultLine2;

  if (type === 'confirm') {
    return (
      <div className={styles.overlay}>
        <div className={styles.popupContainer}>
          <div className={styles.popupIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div className={styles.popupText}>{displayLine1}</div>
          {displayLine2 && <div className={styles.popupText} style={{ fontSize: '18px', marginTop: '10px' }}>{displayLine2}</div>}
          <div className={styles.popupButtons}>
            <button className={styles.popupBtnConfirm} onClick={onConfirm}>ตกลง</button>
            <button className={styles.popupBtnCancel} onClick={onCancel}>ยกเลิก</button>
          </div>
        </div>
      </div>
    );
  }

  const icon = type === 'success' ? '✅' : '❌';

  return (
    <div className={styles.overlay}>
      <div className={`${styles.alertBox} ${styles[type]}`}>
        <div className={styles.iconContainer}>{icon}</div>
        <p className={styles.text}>{displayLine1}</p>
        {displayLine2 && <p className={styles.text}>{displayLine2}</p>}
      </div>
    </div>
  );
}
