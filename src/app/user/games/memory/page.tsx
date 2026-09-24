"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import styles from './memory.module.css';

const MemoryCategoryClient = dynamic(() => import('./MemoryCategoryClient'), {
  ssr: false,
  loading: () => (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.titleWithIcon}>
            <div className={styles.titleIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e76f51" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" fill="#fff" strokeWidth="1.5"></circle>
                <path d="M9.5 5.5A2.5 2.5 0 0 1 12 8v10a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 5.5Z" transform="scale(0.65) translate(6.5, 4.5)"></path>
                <path d="M14.5 5.5A2.5 2.5 0 0 0 12 8v10a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 5.5Z" transform="scale(0.65) translate(6.5, 4.5)"></path>
                <line x1="12" y1="8" x2="12" y2="18" transform="scale(0.65) translate(6.5, 4.5)"></line>
              </svg>
            </div>
            <h1 className={styles.title}>ความจำ</h1>
          </div>
        </div>
      </div>
      <div className={styles.categoriesGrid}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className={styles.skeletonCard}></div>
        ))}
      </div>
    </div>
  )
});

export default function MemoryCategoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <MemoryCategoryClient />
    </Suspense>
  );
}
