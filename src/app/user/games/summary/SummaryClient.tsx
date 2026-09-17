"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import styles from './summary.module.css';
import Loader from '@/app/components/Loader/Loader';

const SummaryChart = dynamic(() => import('./SummaryChart'), { 
  ssr: false, 
  loading: () => <Loader size="1.5px" text="กำลังโหลดกราฟสถิติ..." /> 
});

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

interface SummaryClientProps {
  historyData: { name: string; date: string; score: number }[];
}

export default function SummaryClient({ historyData }: SummaryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Parse query params for the current game stats
  const totalQuestions = Number(searchParams.get('tq')) || 0;
  const clicks = Number(searchParams.get('c')) || 0;
  const correct = Number(searchParams.get('co')) || 0;
  const time = searchParams.get('time') || '0';
  const returnUrl = searchParams.get('returnUrl') || '/user/games';

  const accuracy = clicks > 0 ? (correct / clicks) : 0;
  const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * accuracy * 100) : 0;
  const accuracyDisplay = Math.round(accuracy * 100);

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ justifyContent: 'flex-end' }}>
        <motion.button 
          className={styles.backBtn} 
          onClick={() => router.push(returnUrl)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <BackIcon />
          <span>ย้อนกลับ</span>
        </motion.button>
      </div>

      <div className={styles.content}>
        <div className={styles.scoreSection}>
          <motion.div 
            className={styles.scoreCircle}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
          >
            <span className={styles.scoreValue}>{score}</span>
            <span className={styles.scoreLabel}>คะแนน</span>
          </motion.div>
        </div>

        <div className={styles.statsSection}>
          <div className={styles.chartContainer}>
            <SummaryChart data={historyData} />
            <div className={styles.chartLabel}>
              สถิติคะแนน
            </div>
          </div>

          <motion.div 
            className={styles.statsList}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.4
                }
              }
            }}
          >
            {[
              { title: 'จำนวนข้อ', value: totalQuestions, unit: 'ข้อ' },
              { title: 'ระยะเวลาที่ใช้', value: time, unit: 'นาที' },
              { title: 'ความแม่นยำ', value: accuracyDisplay, unit: '%' },
              { title: 'จำนวนครั้งที่กด', value: clicks, unit: 'ครั้ง' }
            ].map((stat, idx) => (
              <motion.div 
                key={idx} 
                className={styles.statItem}
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: { y: 0, opacity: 1 }
                }}
              >
                <span className={styles.statTitle}>{stat.title}</span>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statUnit}>{stat.unit}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.button 
        className={styles.mobileBackBtn} 
        onClick={() => router.push(returnUrl)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <BackIcon />
        <span>ย้อนกลับ</span>
      </motion.button>
    </div>
  );
}
