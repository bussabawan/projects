"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import styles from './memorySettings.module.css';
import { getExerciseImageCount, getGameData } from '@/app/actions/matchingActions';
import { getExerciseMaxAudioTime } from '@/app/actions/memoryActions';
import { useClickSound } from '@/app/hooks/useClickSound';
import Image from 'next/image';
import SettingControl from '@/app/components/SettingControl/SettingControl';

interface GameTarget {
  id: number;
  title: string;
  imageUrl: string;
  audioUrl?: string;
}

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

const useHoldToIncrement = (playClick: () => void) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopHold = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startHold = (setter: React.Dispatch<React.SetStateAction<number>>, initialValue: number, delta: number, min: number, max: number) => {
    // Prevent multiple intervals
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

    // First click immediately
    if (doUpdate()) {
      // Start holding logic
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          if (!doUpdate()) {
            stopHold();
          }
        }, 70); // 70ms per tick for fast increment with rapid sound
      }, 400); // wait 400ms before repeating
    } else {
      // If hitting bound on first click, maybe still play a sound or not.
      // Usually we play click even if disabled, but disabled buttons won't trigger onMouseDown anyway.
    }
  };

  useEffect(() => {
    return () => stopHold();
  }, []);

  return { startHold, stopHold };
};



export default function MemorySettingsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'picture';

  const [questions, setQuestions] = useState(30);
  const [maxQuestions, setMaxQuestions] = useState(30);
  const [numTargets, setNumTargets] = useState(1);
  const [answers, setAnswers] = useState(2);
  const [showTime, setShowTime] = useState(5);
  const [maxAudioTime, setMaxAudioTime] = useState(2.5);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playClick = useClickSound();
  const { startHold, stopHold } = useHoldToIncrement(playClick);

  // For Preview Animation
  const [previewImages, setPreviewImages] = useState<GameTarget[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (params.id) {
      getExerciseImageCount(Number(params.id)).then(count => {
        setMaxQuestions(count);
        setQuestions(prev => Math.min(prev, count));
      });
      getExerciseMaxAudioTime(Number(params.id)).then(max => {
        setMaxAudioTime(max);
      });
      // Fetch some images for preview
      getGameData(Number(params.id), 5, 2).then(res => {
        if (res.success && res.data) {
          setPreviewImages(res.data.map(q => q.target));
        }
      });
    }
  }, [params.id]);

  // Ensure answers is always strictly greater than numTargets
  useEffect(() => {
    const timer = setTimeout(() => {
      if (answers <= numTargets) {
        setAnswers(numTargets + 1);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [numTargets, answers]);

  const calculatedMinTime = Math.max(1, Math.ceil(numTargets * maxAudioTime));
  const maxAllowedTime = calculatedMinTime <= 30 ? 30 : calculatedMinTime + 60;

  // Ensure showTime is sufficient and within bounds
  useEffect(() => {
    const timer = setTimeout(() => {
      let newTime = showTime;
      if (newTime < calculatedMinTime) {
        newTime = calculatedMinTime;
      }
      if (newTime > maxAllowedTime) {
        newTime = maxAllowedTime;
      }
      if (newTime !== showTime) {
        setShowTime(newTime);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [numTargets, showTime, calculatedMinTime, maxAllowedTime]);

  useEffect(() => {
    if (previewImages.length === 0) return;
    
    setTimeout(() => {
      setTimeLeft(showTime); // Reset time when setting changes
      setFade(true); // Ensure it's visible initially
    }, 0);
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setFade(false); // start fade out
          setTimeout(() => {
            setCurrentImageIndex(idx => (idx + 1) % previewImages.length);
            setImageError(false);
            setTimeLeft(showTime); // Reset time after fade out
            setFade(true); // start fade in
          }, 300); // 300ms transition time
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [previewImages.length, showTime]);

  useEffect(() => {
    // Initialize audio with instruction voice file based on mode
    const audioSrc = mode === 'word' 
      ? '/audio/word_image_memory_instruction.mp3' 
      : '/audio/image_image_memory_instruction.mp3';
      
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
    // Logic to start the game with the selected settings
    router.push(`/user/games/memory/${params.id}/play?mode=${mode}&q=${questions}&a=${answers}&t=${showTime}&tc=${numTargets}`);
  };

  const handleBack = () => {
    playClick();
    router.push(`/user/games/memory`);
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
            label="จำนวนโจทย์ที่ต้องจำ" 
            value={numTargets} 
            setter={setNumTargets} 
            min={1} 
            max={10} 
            startHold={startHold}
            stopHold={stopHold}
          />
          <SettingControl 
            label="จำนวนคำตอบ" 
            value={answers} 
            setter={setAnswers} 
            min={numTargets + 1} 
            max={15} 
            startHold={startHold}
            stopHold={stopHold}
          />
          <SettingControl 
            label="เวลาที่แสดงคำถาม" 
            value={showTime} 
            setter={setShowTime} 
            min={calculatedMinTime} 
            max={maxAllowedTime} 
            startHold={startHold}
            stopHold={stopHold}
          />
        </div>

        {/* Graphics Section */}
        <div className={styles.graphicsContainer}>
          <div className={styles.mainBox}>
            <div className={styles.questionBadge}>
              {questions}
            </div>
            {/* Countdown Badge */}
            {previewImages.length > 0 && (
              <div className={styles.countdownBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {timeLeft}s
              </div>
            )}
            
            {previewImages.length > 0 ? (
              <div 
                className={styles.previewContainer}
                style={{ opacity: fade ? 1 : 0 }}
              >
                {mode === 'word' ? (
                  <div className={styles.wordContainer}>
                    <div className={styles.volumeIconWrapper}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      </svg>
                    </div>
                    <div className={styles.wordText}>
                      {previewImages[currentImageIndex].title}
                    </div>
                  </div>
                ) : (
                  <div className={styles.imageContainer}>
                    {!imageError ? (
                      <>
                        <Image 
                          src={previewImages[currentImageIndex].imageUrl} 
                          alt="preview" 
                          className={styles.previewImage}
                          width={200}
                          height={200}
                          style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                          onError={() => setImageError(true)}
                          unoptimized
                        />
                      </>
                    ) : (
                      <StackedPictureIcon />
                    )}
                  </div>
                )}
              </div>
            ) : (
              mode === 'word' ? <WordToImageIcon /> : <StackedPictureIcon />
            )}
          </div>
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
