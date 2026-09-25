"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import styles from './matchingSettings.module.css';
import { getExerciseImageCount, getGameData } from '@/app/actions/matchingActions';
import { useClickSound } from '@/app/hooks/useClickSound';
import Image from 'next/image';
import SettingControl from '@/app/components/SettingControl/SettingControl';

interface GameTarget {
  id: number;
  title: string;
  imageUrl: string;
  audioUrl?: string;
}

interface GameDataPreview {
  target: GameTarget;
  choices: GameTarget[];
}

// Generic picture icon SVG
const PictureIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

// Volume Icon SVG
const VolumeIcon = ({ isMuted }: { isMuted: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const useHoldToIncrement = (playClick: () => void) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopHold = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startHold = (setter: React.Dispatch<React.SetStateAction<number>>, initialValue: number, delta: number, min: number, max: number) => {
    stopHold();
    let currentVal = initialValue;

    const doUpdate = () => {
      const newVal = currentVal + delta;
      if (newVal >= min && newVal <= max) {
        currentVal = newVal;
        playClick();
        setter(newVal);
        return true;
      }
      return false;
    };

    if (doUpdate()) {
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          if (!doUpdate()) {
            stopHold();
          }
        }, 70);
      }, 400);
    }
  };

  useEffect(() => {
    return () => stopHold();
  }, []);

  return { startHold, stopHold };
};



export default function MatchingSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const type = searchParams.get('type') || 'image';

  const [questions, setQuestions] = useState(30);
  const [maxQuestions, setMaxQuestions] = useState(30);
  const [answers, setAnswers] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playClick = useClickSound();
  const { startHold, stopHold } = useHoldToIncrement(playClick);

  // For Preview Animation
  const [previewData, setPreviewData] = useState<GameDataPreview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (params.id) {
      getExerciseImageCount(Number(params.id)).then(count => {
        setMaxQuestions(count);
        setQuestions(prev => Math.min(prev, count));
      });
      // Fetch some images for preview, we need up to 6 choices to show in the small boxes based on answers setting
      getGameData(Number(params.id), 5, 6).then(res => {
        if (res.success && res.data) {
          setPreviewData(res.data);
        }
      });
    }
  }, [params.id]);

  useEffect(() => {
    if (previewData.length === 0) return;
    
    const initialTimer = setTimeout(() => {
      setFade(true); // Ensure it's visible initially
    }, 0);
    
    const interval = setInterval(() => {
      setFade(false); // start fade out
      setTimeout(() => {
        setCurrentIndex(idx => (idx + 1) % previewData.length);
        setImageError(false);
        setFade(true); // start fade in
      }, 300); // 300ms transition time
    }, 8000); // Change every 8 seconds
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [previewData.length]);

  useEffect(() => {
    // Initialize audio
    const audioSrc = type === 'image' 
      ? '/audio/image_image_matching_instruction.mp3' 
      : '/audio/word_image_matching_instruction.mp3';
      
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
  }, [type]);

  const toggleAudio = () => {
    playClick();
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
    playClick();
    // Logic to start the game
    router.push(`/user/games/matching/${params.id}/play?type=${type}&q=${questions}&a=${answers}`);
    console.log("Starting game with:", { questions, answers });
  };

  const handleBack = () => {
    playClick();
    router.push(`/user/games/matching?type=${type}`);
  };


  const title = type === 'image' ? 'จับคู่ภาพกับภาพ' : 'จับคู่คำกับภาพ';
  const subtitle = type === 'image' 
    ? 'เลือกชิ้นส่วนภาพเหมือนในตัวเลือกให้ถูกต้อง' 
    : 'เลือกชิ้นส่วนภาพในตัวเลือกให้ตรงกับคำให้ถูกต้อง';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {title}
          <button 
            className={styles.audioToggleBtn} 
            onClick={toggleAudio}
            aria-label={isPlaying ? "Mute instruction" : "Play instruction"}
            title={isPlaying ? "ปิดเสียงคำแนะนำ" : "เปิดเสียงคำแนะนำ"}
          >
            <VolumeIcon isMuted={!isPlaying} />
          </button>
        </h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <div className={styles.contentRow}>
        {/* Graphics Section */}
        <div className={styles.graphicsContainer}>
          <div className={styles.mainBox}>
            <div className={styles.questionBadge}>
              {questions}
            </div>
            {previewData.length > 0 ? (
              <div 
                className={styles.previewContainer}
                style={{ opacity: fade ? 1 : 0 }}
              >
                {type === 'word' ? (
                  <div className={styles.wordContainer}>
                    <div className={styles.volumeIconWrapper}>
                      <VolumeIcon isMuted={false} />
                    </div>
                    <div className={styles.wordText}>
                      {previewData[currentIndex].target.title}
                    </div>
                  </div>
                ) : (
                  <div className={styles.imageContainer}>
                    {!imageError ? (
                      <>
                        <Image 
                          src={previewData[currentIndex].target.imageUrl} 
                          alt="preview target" 
                          className={styles.previewImage}
                          width={200}
                          height={200}
                          style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                          onError={() => setImageError(true)}
                          unoptimized
                        />
                      </>
                    ) : (
                      <>
                        <PictureIcon />
                        <div className={styles.questionMark}>?</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              type === 'image' ? (
                <>
                  <PictureIcon />
                </>
              ) : (
                <>
                  <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    <VolumeIcon isMuted={false} />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 'normal', color: '#000', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                    Text<span style={{ fontSize: '2.5rem', marginBottom: '-5px' }}>?</span>
                  </div>
                </>
              )
            )}
          </div>
          
          <div className={styles.optionsBoxContainer}>
            {previewData.length > 0 ? (
               previewData[currentIndex].choices.slice(0, answers).map((choice: GameTarget, idx: number) => (
                 <div key={idx} className={styles.optionBox} style={{ overflow: 'hidden' }}>
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      opacity: fade ? 1 : 0, 
                      transition: 'opacity 0.3s ease-in-out',
                      padding: '8px'
                    }}>
                      <Image 
                        src={choice.imageUrl} 
                        alt="choice" 
                        width={200}
                        height={200}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        unoptimized
                      />
                    </div>
                 </div>
               ))
            ) : (
               Array.from({ length: answers }).map((_, idx) => (
                 <div key={idx} className={styles.optionBox}>
                   <PictureIcon />
                 </div>
               ))
            )}
          </div>
        </div>

        {/* Settings Section */}
        <div className={styles.settingsContainer}>
          <h2 className={styles.settingsTitle}>ตั้งค่าการฝึก</h2>
          
          <SettingControl 
            label="จำนวนคำถาม" 
            value={questions} 
            setter={setQuestions} 
            min={1} 
            max={maxQuestions} 
            startHold={startHold}
            stopHold={stopHold}
          />
          <SettingControl 
            label="จำนวนคำตอบ" 
            value={answers} 
            setter={setAnswers} 
            min={2} 
            max={6} 
            startHold={startHold}
            stopHold={stopHold}
          />
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button className={styles.backBtn} onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          ย้อนกลับ
        </button>
        <button className={styles.startBtn} onClick={handleStart}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          เริ่มเกม
        </button>
      </div>
    </div>
  );
}
