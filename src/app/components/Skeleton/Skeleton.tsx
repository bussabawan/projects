import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  type?: 'table' | 'card';
  count?: number;
}

export default function Skeleton({ type = 'table', count = 5 }: SkeletonProps) {
  if (type === 'card') {
    return (
      <div className={styles.skeletonCardContainer}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}></div>
        ))}
      </div>
    );
  }

  // Default to table/row style
  return (
    <div className={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}></div>
      ))}
    </div>
  );
}
