import React from 'react';
import Link from 'next/link';
import Footer from '@/app/components/Footer/Footer';
import styles from './games.module.css';

export default function GameTypesPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ประเภทเกม</h1>
      
      <div className={styles.cardsGrid}>
        
        {/* จับคู่ (Matching) */}
        <Link href="/user/games/matching" className={styles.gameCard}>
          <div className={styles.iconContainer}>
            {/* Matching Game SVG approximation */}
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#f4a261" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M14.5 12h-5a2.5 2.5 0 0 1-2.5-2.5v-5"></path>
              <path d="M9.5 12h5a2.5 2.5 0 0 1 2.5 2.5v5"></path>
              <rect x="5.5" y="4.5" width="4" height="4" rx="1"></rect>
              <rect x="14.5" y="15.5" width="4" height="4" rx="1"></rect>
              <circle cx="9.5" cy="15.5" r="1.5" fill="#e76f51"></circle>
              <circle cx="14.5" cy="8.5" r="1.5" fill="#e76f51"></circle>
            </svg>
          </div>
          <div className={styles.gameTitle}>จับคู่</div>
        </Link>
        
        {/* ความจำ (Memory) */}
        <Link href="/user/games/memory" className={styles.gameCard}>
          <div className={styles.iconContainer}>
            {/* Memory Game SVG approximation */}
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#e76f51" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
              <line x1="12" y1="4.5" x2="12" y2="19.5"></line>
            </svg>
          </div>
          <div className={styles.gameTitle}>ความจำ</div>
        </Link>
        
        {/*ร่างกาย */}
        <Link href="" className={styles.gameCard}>
          <div className={styles.iconContainer}>
            {/* Memory Game SVG approximation */}
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#e76f51" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
              <line x1="12" y1="4.5" x2="12" y2="19.5"></line>
            </svg>
          </div>
          <div className={styles.gameTitle}>ร่างกาย</div>
        </Link>
      </div>

      <div className={styles.footerWrapper}>
        <Footer inline={true} />
      </div>
    </div>
  );
}
