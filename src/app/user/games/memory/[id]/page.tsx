"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import styles from './memorySettings.module.css';
import { getExerciseImageCount } from '@/app/actions/matchingActions';

const StackedPictureIcon = () => (
  <svg width="180" height="180" viewBox="0 0 120 120" fill="none" stroke="black" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <clipPath id="cardClip">
        <rect x="30" y="25" width="60" height="60" rx="10" ry="10" />
      </clipPath>
    </defs>
    
    {/* Card Background */}
    <rect x="30" y="25" width="60" height="60" rx="10" ry="10" fill="#d9d9d9" />
    
    {/* Picture Details on Card */}
    <circle cx="45" cy="42" r="5" fill="black" stroke="none" />
    <polyline points="25 80 55 50 95 90" clipPath="url(#cardClip)" />
    
    {/* Card Outline */}
    <rect x="30" y="25" width="60" height="60" rx="10" ry="10" />

    {/* Question mark */}
    <text x="75" y="100" fontSize="55" fontFamily="sans-serif" fontWeight="900" fill="#4f4f4f" stroke="white" strokeWidth="3" paintOrder="stroke fill">?</text>
  </svg>
);

const WordToImageIcon = () => (
  <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
    <div style={{ position: 'absolute', top: '15px', left: '15px' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      </svg>
    </div>
    <div style={{ fontSize: '4.5rem', fontWeight: 500, color: '#000' }}>Text</div>
    <div style={{ position: 'absolute', bottom: '5px', right: '25px', fontSize: '3.5rem', color: '#000' }}>?</div>
  </div>
);

// Volume Icon SVG
const VolumeIcon = ({ isMuted }: { isMuted: boolean }) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {isMuted ? (
      <>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      </>
    ) : (
      <>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      </>
    )}
  </svg>
);

export default function MemorySettingsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'picture';

  const [questions, setQuestions] = useState(30);
  const [maxQuestions, setMaxQuestions] = useState(30);
  const [answers, setAnswers] = useState(2);
  const [showTime, setShowTime] = useState(5);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (params.id) {
      getExerciseImageCount(Number(params.id)).then(count => {
        setMaxQuestions(count);
        setQuestions(prev => Math.min(prev, count));
      });
    }
  }, [params.id]);

  useEffect(() => {
    // Initialize audio with instruction voice file based on mode
    const audioSrc = mode === 'word' 
      ? '/api/uploads/word_image_memory_instruction.mp3' 
      : '/api/uploads/memory_instruction.mp3';
      
    audioRef.current = new Audio(audioSrc);
    audioRef.current.onended = () => setIsPlaying(false);
    
    // Attempt to play on mount
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.log("Autoplay prevented:", error);
          setIsPlaying(false);
        });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [mode]);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleStart = () => {
    // Logic to start the game with the selected settings
    router.push(`/user/games/memory/${params.id}/play?mode=${mode}&q=${questions}&a=${answers}&t=${showTime}`);
  };

  const handleBack = () => {
    router.push(`/user/games/memory`);
  };

  const updateValue = (setter: React.Dispatch<React.SetStateAction<number>>, current: number, delta: number, min: number, max: number) => {
    const newValue = current + delta;
    if (newValue >= min && newValue <= max) {
      setter(newValue);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {mode === 'word' ? 'จำคำแล้วเลือกภาพ' : 'จำภาพเหมือน'}
          <button 
            className={styles.audioToggleBtn} 
            onClick={toggleAudio}
            aria-label={isPlaying ? "Mute instruction" : "Play instruction"}
            title={isPlaying ? "ปิดเสียงคำแนะนำ" : "เปิดเสียงคำแนะนำ"}
          >
            <VolumeIcon isMuted={!isPlaying} />
          </button>
        </h1>
        <p className={styles.subtitle}>
          {mode === 'word' 
            ? 'เลือกชิ้นส่วนภาพในตัวเลือกให้ตรงกับคำให้ถูกต้อง' 
            : 'เลือกชิ้นส่วนภาพเหมือนในตัวเลือกให้ถูกต้อง'}
        </p>
      </div>

      <div className={styles.contentRow}>
        {/* Graphics Section */}
        <div className={styles.graphicsContainer}>
          <div className={styles.mainBox}>
            {mode === 'word' ? <WordToImageIcon /> : <StackedPictureIcon />}
          </div>
        </div>

        {/* Settings Section */}
        <div className={styles.settingsContainer}>
          <h2 className={styles.settingsTitle}>ตั้งค่าการฝึก</h2>
          
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>จำนวนคำถาม</span>
            <div className={styles.controlGroup}>
              <button 
                className={styles.controlBtn} 
                onClick={() => updateValue(setQuestions, questions, -1, 1, maxQuestions)}
                disabled={questions <= 1}
              >
                -
              </button>
              <input 
                type="number" 
                className={styles.controlValue} 
                value={questions} 
                readOnly 
              />
              <button 
                className={styles.controlBtn} 
                onClick={() => updateValue(setQuestions, questions, 1, 1, maxQuestions)}
                disabled={questions >= maxQuestions}
              >
                +
              </button>
            </div>
          </div>

          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>จำนวนคำตอบ</span>
            <div className={styles.controlGroup}>
              <button 
                className={styles.controlBtn} 
                onClick={() => updateValue(setAnswers, answers, -1, 2, 6)}
                disabled={answers <= 2}
              >
                -
              </button>
              <input 
                type="number" 
                className={styles.controlValue} 
                value={answers} 
                readOnly 
              />
              <button 
                className={styles.controlBtn} 
                onClick={() => updateValue(setAnswers, answers, 1, 2, 6)}
                disabled={answers >= 6}
              >
                +
              </button>
            </div>
          </div>

          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>เวลาที่แสดงคำตอบ</span>
            <div className={styles.controlGroup}>
              <button 
                className={styles.controlBtn} 
                onClick={() => updateValue(setShowTime, showTime, -1, 1, 20)}
                disabled={showTime <= 1}
              >
                -
              </button>
              <input 
                type="number" 
                className={styles.controlValue} 
                value={showTime} 
                readOnly 
              />
              <button 
                className={styles.controlBtn} 
                onClick={() => updateValue(setShowTime, showTime, 1, 1, 20)}
                disabled={showTime >= 20}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button className={styles.backBtn} onClick={handleBack}>ย้อนกลับ</button>
        <button className={styles.startBtn} onClick={handleStart}>เริ่มเกม</button>
      </div>
    </div>
  );
}
