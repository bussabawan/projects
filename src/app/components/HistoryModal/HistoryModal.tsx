"use client";

import { useState } from 'react';

import BaseModal from '../BaseModal/BaseModal';
import styles from './HistoryModal.module.css';
import { PuzzleIcon, BrainIcon } from '@/app/components/Icons';

interface HistoryDetail {
  id: number;
  time: string;
  icon: string;
  game: string;
  score: string;
  duration: string;
}

interface HistoryRowData {
  id: number;
  dateStr: string;
  plays: string;
  totalTime: string;
  details: HistoryDetail[];
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: HistoryRowData | null;
}

export default function HistoryModal({ isOpen, onClose, data }: HistoryModalProps) {
  const [activeFilter, setActiveFilter] = useState<string>('ทั้งหมด');

  if (!data) return null;

  const filters = ['ทั้งหมด', ...Array.from(new Set(data.details.map(d => d.game)))];

  const filteredDetails = activeFilter === 'ทั้งหมด' 
    ? data.details 
    : data.details.filter(d => d.game === activeFilter);

  const getScoreColorClass = (scoreStr: string) => {
    const num = parseInt(scoreStr.replace(/[^0-9]/g, ''));
    if (isNaN(num)) return styles.scoreNeutral;
    if (num >= 80) return styles.scoreGood;
    if (num < 50) return styles.scoreBad;
    return styles.scoreNeutral;
  };

  const getGameIcon = (gameName: string) => {
    if (gameName === 'จับคู่') {
      return (
        <PuzzleIcon size="1.1rem" style={{ color: '#10b981' }} />
      );
    }
    if (gameName === 'ความจำ') {
      return (
        <BrainIcon size="1.1rem" style={{ color: '#ec4899' }} />
      );
    }
    return (
      <span style={{ fontSize: '1.1rem' }}>🎮</span>
    );
  };

  const title = data.dateStr;
  const subtitle = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <span>🎮 {data.plays}</span>
      <span>⏱️ {data.totalTime}</span>
    </div>
  );

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title} 
      subtitle={subtitle}
    >
      <div className={styles.contentWrapper}>

        {filters.length > 2 && (
          <div className={styles.filters}>
            {filters.map(filter => (
              <div 
                key={filter} 
                className={`${styles.filterPill} ${activeFilter === filter ? styles.active : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'ทั้งหมด' ? (
                  <span>ทั้งหมด</span>
                ) : filter === 'ความจำ' ? (
                  <>
                    <span className={styles.filterIcon}><BrainIcon size="1em" style={{ color: '#ec4899' }} /></span>
                    <span>ความจำ</span>
                  </>
                ) : filter === 'จับคู่' ? (
                  <>
                    <span className={styles.filterIcon}><PuzzleIcon size="1em" style={{ color: '#10b981' }} /></span>
                    <span>จับคู่</span>
                  </>
                ) : (
                  <span>{filter}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={styles.body}>
          {filteredDetails.map(detail => (
            <div key={detail.id} className={styles.card}>
              <div className={styles.timeText}>{detail.time}</div>
              <div className={styles.gameInfo}>
                <div className={styles.gameTitle}>
                  {getGameIcon(detail.game)}
                  {detail.game}
                </div>
                <div className={styles.durationText}>ใช้เวลา {detail.duration}</div>
              </div>
              <div className={`${styles.scoreBadge} ${getScoreColorClass(detail.score)}`}>
                {detail.score.split(' ')[0]}
                <span className={styles.scoreUnit}>{detail.score.split(' ')[1] || 'คะแนน'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseModal>
  );
}
