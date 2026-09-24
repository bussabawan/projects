"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import styles from './matching.module.css';

const MatchingCategoryClient = dynamic(() => import('./MatchingCategoryClient'), {
  ssr: false,
  loading: () => (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.titleWithIcon}>
            <div className={styles.titleIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f4a261" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" fill="#fff" strokeWidth="1.5"></circle>
                <path d="M14.5 12h-5a2.5 2.5 0 0 1-2.5-2.5v-5"></path>
                <path d="M9.5 12h5a2.5 2.5 0 0 1 2.5 2.5v5"></path>
                <rect x="5.5" y="4.5" width="4" height="4" rx="1"></rect>
                <rect x="14.5" y="15.5" width="4" height="4" rx="1"></rect>
                <circle cx="9.5" cy="15.5" r="1.5" fill="#e76f51" stroke="none"></circle>
                <circle cx="14.5" cy="8.5" r="1.5" fill="#e76f51" stroke="none"></circle>
              </svg>
            </div>
            <h1 className={styles.title}>จับคู่</h1>
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

export default function MatchingCategoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <MatchingCategoryClient />
    </Suspense>
  );
}
