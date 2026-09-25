"use client";

import React, { useEffect } from 'react';
import styles from './BaseModal.module.css';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  headerRight?: React.ReactNode;
}

export default function BaseModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  maxWidth = '450px',
  headerRight 
}: BaseModalProps) {
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.modal} 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          
          <div className={styles.headerActions}>
            {headerRight}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              ✕
            </button>
          </div>
        </div>
        
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
