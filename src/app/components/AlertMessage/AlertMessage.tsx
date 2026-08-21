import React from 'react';
import styles from './AlertMessage.module.css';

interface AlertMessageProps {
  type: 'success' | 'error';
  line1?: string;
  line2?: string;
  show?: boolean;
}

export default function AlertMessage({ 
  type, 
  line1 = type === 'success' ? 'คำตอบถูกต้อง' : 'คำตอบไม่ถูกต้อง', 
  line2 = type === 'success' ? 'กำลังไปข้อถัดไป...' : 'กรุณาลองใหม่',
  show = true 
}: AlertMessageProps) {
  
  if (!show) return null;

  const icon = type === 'success' ? '✅' : '❌';

  return (
    <div className={styles.overlay}>
      <div className={`${styles.alertBox} ${styles[type]}`}>
        <div className={styles.iconContainer}>{icon}</div>
        <p className={styles.text}>{line1}</p>
        {line2 && <p className={styles.text}>{line2}</p>}
      </div>
    </div>
  );
}
