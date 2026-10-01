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
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>🧩</span>
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
