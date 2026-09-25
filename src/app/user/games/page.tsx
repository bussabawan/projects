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
            <span style={{ fontSize: '4rem', lineHeight: 1 }}>🧍</span>
          </div>
          <div className={styles.gameTitle}>ร่างกาย</div>
          <div className={styles.comingSoonOverlay}>Coming soon...</div>
        </div>
      </div>
    </div>
  );
}
