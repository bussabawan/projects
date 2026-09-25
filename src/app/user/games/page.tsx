import Link from 'next/link';
import styles from './games.module.css';

export default function GameTypesPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ประเภทเกม</h1>
      
      <div className={styles.cardsGrid}>
        
        {/* จับคู่ (Matching) */}
        <Link href="/user/games/matching" className={styles.gameCard}>
          <div className={styles.iconContainer}>
            <span style={{ fontSize: '4rem', lineHeight: 1 }}>🧩</span>
          </div>
          <div className={styles.gameTitle}>จับคู่</div>
        </Link>
        
        {/* ความจำ (Memory) */}
        <Link href="/user/games/memory" className={styles.gameCard}>
          <div className={styles.iconContainer}>
            <span style={{ fontSize: '4rem', lineHeight: 1 }}>🧠</span>
          </div>
          <div className={styles.gameTitle}>ความจำ</div>
        </Link>
        
        {/*ร่างกาย */}
        <div className={`${styles.gameCard} ${styles.disabledCard}`}>
          <div className={styles.iconContainer}>
            {/* Memory Game SVG approximation */}
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24">
              <circle cx="12" cy="5.5" r="3" fill="#f4a261" />
              <path d="M5 11.5 h14" stroke="#e76f51" strokeWidth="4" strokeLinecap="round" />
              <path d="M12 11.5 v4.5" stroke="#e76f51" strokeWidth="4" />
              <path d="M8.5 21.5 l3.5-6 l3.5 6" stroke="#e76f51" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className={styles.gameTitle}>ร่างกาย</div>
          <div className={styles.comingSoonOverlay}>Coming soon...</div>
        </div>
      </div>
    </div>
  );
}
