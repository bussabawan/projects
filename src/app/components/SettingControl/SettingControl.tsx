"use client";

import React from 'react';
import styles from './SettingControl.module.css';

interface SettingControlProps {
  label: string;
  value: number;
  setter: React.Dispatch<React.SetStateAction<number>>;
  min: number;
  max: number;
  startHold: (setter: React.Dispatch<React.SetStateAction<number>>, initialValue: number, delta: number, min: number, max: number) => void;
  stopHold: () => void;
}

export default function SettingControl({ 
  label, 
  value, 
  setter, 
  min, 
  max,
  startHold,
  stopHold
}: SettingControlProps) {
  return (
    <div className={styles.settingRow}>
      <span className={styles.settingLabel}>{label}</span>
      <div className={styles.controlGroup}>
        <button 
          className={styles.controlBtn} 
          onMouseDown={() => startHold(setter, value, -1, min, max)}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold(setter, value, -1, min, max)}
          onTouchEnd={stopHold}
          disabled={value <= min}
        >
          -
        </button>
        <input 
          type="number" 
          className={styles.controlValue} 
          value={value} 
          readOnly 
        />
        <button 
          className={styles.controlBtn} 
          onMouseDown={() => startHold(setter, value, 1, min, max)}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold(setter, value, 1, min, max)}
          onTouchEnd={stopHold}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}
