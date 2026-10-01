import Link from 'next/link';
import styles from './games.module.css';
import { PuzzleIcon, BrainIcon, PersonIcon } from '@/app/components/Icons';

export default function GameTypesPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ประเภทเกม</h1>
      
      <div className={styles.cardsGrid}>
        
        {/* จับคู่ (Matching) */}
        <Link href="/user/games/matching" className={styles.gameCard}>
          <div className={styles.iconContainer}>
            <PuzzleIcon size="4rem" style={{ color: '#10b981' }} />
          </div>
          <div className={styles.gameTitle}>จับคู่</div>
        </Link>
        
        {/* ความจำ (Memory) */}
        <Link href="/user/games/memory" className={styles.gameCard}>
          <div className={styles.iconContainer}>
            <BrainIcon size="4rem" style={{ color: '#ec4899' }} />
          </div>
          <div className={styles.gameTitle}>ความจำ</div>
        </Link>
        
        {/*ร่างกาย */}
        <div className={`${styles.gameCard} ${styles.disabledCard}`}>
          <div className={styles.iconContainer}>
            <PersonIcon size="4rem" style={{ color: '#888' }} />
          </div>
          <div className={styles.gameTitle}>ร่างกาย</div>
          <div className={styles.comingSoonOverlay}>Coming soon...</div>
        </div>
      </div>
    </div>
  );
}
