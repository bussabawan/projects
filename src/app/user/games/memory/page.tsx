"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import styles from './memory.module.css';
import { BrainIcon } from '@/app/components/Icons';

const MemoryCategoryClient = dynamic(() => import('./MemoryCategoryClient'), {
  ssr: false,
  loading: () => (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.titleWithIcon}>
            <div className={styles.titleIcon}>
              <BrainIcon size="2rem" style={{ color: '#ec4899' }} />
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
