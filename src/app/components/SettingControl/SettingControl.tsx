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
          onPointerDown={() => startHold(setter, value, -1, min, max)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          onContextMenu={(e) => e.preventDefault()}
          disabled={value <= min}
        >
          -
        </button>
        <div className={styles.controlValue}>
          {value}
        </div>
        <button 
          className={styles.controlBtn} 
          onPointerDown={() => startHold(setter, value, 1, min, max)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          onContextMenu={(e) => e.preventDefault()}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}
