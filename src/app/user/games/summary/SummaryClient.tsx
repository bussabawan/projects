"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from './summary.module.css';
import Loader from '@/app/components/Loader/Loader';

const SummaryChart = dynamic(() => import('./SummaryChart'), { 
  ssr: false, 
  loading: () => <Loader size="1.5px" text="กำลังโหลดกราฟสถิติ..." /> 
});

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
        <button className={styles.backBtn} onClick={() => router.push(returnUrl)}>
          ย้อนกลับ
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.scoreSection}>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreValue}>{score}</span>
            <span className={styles.scoreLabel}>คะแนน</span>
          </div>
        </div>

        <div className={styles.statsSection}>
          <div className={styles.chartContainer}>
            <SummaryChart data={historyData} />
            <div className={styles.chartLabel}>
              สถิติคะแนน
            </div>
          </div>

          <div className={styles.statsList}>
            <div className={styles.statItem}>
              <span className={styles.statTitle}>จำนวนข้อ</span>
              <span className={styles.statValue}>{totalQuestions}</span>
              <span className={styles.statUnit}>ข้อ</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statTitle}>ระยะเวลาที่ใช้</span>
              <span className={styles.statValue}>{time}</span>
              <span className={styles.statUnit}>นาที</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statTitle}>ความแม่นยำ</span>
              <span className={styles.statValue}>{accuracyDisplay}%</span>
              <span className={styles.statUnit}></span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statTitle}>จำนวนครั้งที่กด</span>
              <span className={styles.statValue}>{clicks}</span>
              <span className={styles.statUnit}>ครั้ง</span>
            </div>
          </div>
        </div>
      </div>

      <button className={styles.mobileBackBtn} onClick={() => router.push(returnUrl)}>
        ย้อนกลับ
      </button>
    </div>
  );
}
