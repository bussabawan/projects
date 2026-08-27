"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './summary.module.css';

interface SummaryClientProps {
  historyData: any[];
}

export default function SummaryClient({ historyData }: SummaryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={historyData}>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.date}</p>
                          <p style={{ margin: 0, color: '#000' }}>คะแนน: {data.score}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" fill="#9B59B6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
    </div>
  );
}
