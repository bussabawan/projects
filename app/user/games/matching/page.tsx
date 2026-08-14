"use client";

import dynamic from 'next/dynamic';
import React from 'react';
import styles from './matching.module.css';

const MatchingCategoryClient = dynamic(() => import('./MatchingCategoryClient'), {
  ssr: false,
  loading: () => (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>จับคู่</h1>
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
  return <MatchingCategoryClient />;
}
