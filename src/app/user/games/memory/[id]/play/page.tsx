"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import styles from './memoryPlay.module.css';
import { getMemoryGameData, saveMemoryGameResult } from '@/app/actions/memoryActions';
import AlertMessage from '@/app/components/AlertMessage/AlertMessage';
import Image from 'next/image';
import Loader from '@/app/components/Loader/Loader';
import { useClickSound } from '@/app/hooks/useClickSound';
import { motion} from 'framer-motion';

// Global cache for audio objects to prevent double loading
const audioCache = new Map<string, HTMLAudioElement>();

type ImageInfo = {
  id: number;
  title: string;
  imageUrl: string;
  audioUrl?: string;
};

type GameData = {
  targets: ImageInfo[];
  choices: ImageInfo[];
};

// Exit / End Game Icon SVG
const ExitIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export default function MemoryGamePlayPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const mode = searchParams.get('mode') || 'picture';
  const numQuestionsSetting = parseInt(searchParams.get('q') || '30', 10);
  const numAnswersSetting = parseInt(searchParams.get('a') || '4', 10);
  const showTimeSetting = parseInt(searchParams.get('t') || '5', 10);
  const numTargetsSetting = parseInt(searchParams.get('tc') || '1', 10);

  const [gameState, setGameState] = useState<'loading' | 'question' | 'options' | 'summary' | 'error'>('loading');
  const [questions, setQuestions] = useState<GameData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Game statistics
  const [clickCount, setClickCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [timeLogs, setTimeLogs] = useState<{photoId: number, timePerQuestion: string}[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<number[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [correctChoiceIds, setCorrectChoiceIds] = useState<number[]>([]);
  const [, setIsAudioPlaying] = useState(false);
  
  // Timers
  const [countdown, setCountdown] = useState(showTimeSetting);
  const [stopwatch, setStopwatch] = useState(0);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stopwatchRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playClick = useClickSound();

  const preloadAssets = async (questionsList: GameData[]) => {
    const assets: Promise<void>[] = [];
    
    const preloadAudio = (url: string) => {
      const bitrate = window.innerWidth <= 425 ? 32 : 64;
      const separator = url.includes('?') ? '&' : '?';
      const audioUrlWithBitrate = `${url}${separator}bitrate=${bitrate}`;

      if (audioCache.has(audioUrlWithBitrate)) return;

      assets.push(new Promise((resolve) => {
        const audio = new window.Audio();
        audioCache.set(audioUrlWithBitrate, audio);
        audio.src = audioUrlWithBitrate;
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => resolve();
        setTimeout(resolve, 3000); // timeout for audio
      }));
    };

    const imageCache = new Set<string>();

    const preloadImage = (url: string) => {
      if (imageCache.has(url)) return;
      imageCache.add(url);

      assets.push(new Promise((resolve) => {
        const img = new window.Image();
        img.src = url;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      }));
    };

    questionsList.forEach(q => {
      q.targets.forEach(t => {
        if (t.audioUrl) preloadAudio(t.audioUrl);
        if (t.imageUrl) preloadImage(t.imageUrl);
      });
      
      q.choices.forEach((c) => {
        if (c.audioUrl) preloadAudio(c.audioUrl);
        if (c.imageUrl) preloadImage(c.imageUrl);
      });
    });

    await Promise.all(assets);
  };

  useEffect(() => {
    const loadGameData = async (exerciseId: number) => {
      try {
        const result = await getMemoryGameData(exerciseId, numQuestionsSetting, numAnswersSetting, numTargetsSetting);
        if (result.success && result.data) {
          setQuestions(result.data);
          await preloadAssets(result.data);
          setGameState('question');
        } else {
          setGameState('error');
        }
      } catch (error) {
        console.error("Error loading game data:", error);
        setGameState('error');
      }
    };

    if (params.id) {
      loadGameData(Number(params.id));
    }
  }, [params.id, numQuestionsSetting, numAnswersSetting, numTargetsSetting]);

  // Handle Question Phase Timer
  useEffect(() => {
    if (gameState === 'question') {
      const q = questions[currentQuestionIndex];
      let totalAudioDuration = 0;
      
      if (q) {
         const bitrate = window.innerWidth <= 425 ? 32 : 64;
         q.targets.forEach(t => {
           if (t.audioUrl) {
             const separator = t.audioUrl.includes('?') ? '&' : '?';
             const url = `${t.audioUrl}${separator}bitrate=${bitrate}`;
             const audio = audioCache.get(url);
             if (audio && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
               totalAudioDuration += audio.duration + 0.15; // Include the 150ms delay
             } else {
               totalAudioDuration += 2; // Safe fallback if duration isn't available
             }
           }
         });
      }
      
      // The countdown is whichever is longer: the setting or the calculated audio duration
      const initialTime = Math.max(showTimeSetting, Math.ceil(totalAudioDuration));
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdown(initialTime);
      
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState('options');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentQuestionIndex, showTimeSetting, questions]);

  // Handle Options Phase Stopwatch and Total Timer
  useEffect(() => {
    if (gameState === 'options') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStopwatch(0);
      const startTime = Date.now();
      const lastTotal = totalElapsedSeconds;

      stopwatchRef.current = setInterval(() => {
        const elapsedMs = Date.now() - startTime;
        setStopwatch(elapsedMs / 1000);
        setTotalElapsedSeconds(lastTotal + Math.floor(elapsedMs / 1000));
      }, 100);
    }
    
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, currentQuestionIndex]);

  const playAudio = useCallback((url?: string): Promise<void> => {
    return new Promise((resolve) => {
      // 1. หยุดเสียงเก่าทุกกรณี (จำเป็นสำหรับบางเบราว์เซอร์เพื่อให้เริ่มเล่นใหม่ได้)
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // 2. ถ้าไม่มีเสียงใหม่ให้เล่น หรือปิดเสียงอยู่ ให้จบการทำงาน
      if (!url || isMuted) {
        resolve();
        return;
      }
      
      // Determine bitrate based on screen size (Mobile L: 425px)
      const bitrate = window.innerWidth <= 425 ? 32 : 64;
      const separator = url.includes('?') ? '&' : '?';
      const audioUrlWithBitrate = `${url}${separator}bitrate=${bitrate}`;
      
      let audio = audioCache.get(audioUrlWithBitrate);
      // Bulletproof: ป้องกัน Cache พังจาก Hot-reload
      if (!audio || !audio.src || audio.src === "" || audio.src === window.location.href) {
        audio = new window.Audio(audioUrlWithBitrate);
        audioCache.set(audioUrlWithBitrate, audio);
      }
      
      // 3. เริ่มเล่นจาก 0
      try {
        audio.currentTime = 0;
      } catch {}
      
      audioRef.current = audio;
      
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      
      // 4. เล่นเสียง
      audio.play().catch(e => {
        console.log("Audio play failed:", e);
        resolve();
      });
    });
  }, [isMuted]);

  // Play audio when entering question state
  useEffect(() => {
    let isActive = true;

    const playSequentially = async () => {
      if (gameState === 'question' && questions[currentQuestionIndex]) {
        setIsAudioPlaying(true);
        const currentQ = questions[currentQuestionIndex];
        for (const target of currentQ.targets) {
          if (!isActive) break;
          if (target.audioUrl) {
            await playAudio(target.audioUrl);
            if (!isActive) break;
            // Short delay between audios
            await new Promise(resolve => setTimeout(resolve, 150));
          }
        }
        if (isActive) {
          setIsAudioPlaying(false);
        }
      }
    };

    playSequentially();

    return () => {
      isActive = false;
    };
  }, [gameState, currentQuestionIndex, questions, playAudio]);

  const formatTimeMMSS = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}.${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeForDB = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };



  const handleOptionClick = async (selectedChoice: ImageInfo) => {
    playClick();
    const audioPromise = playAudio(selectedChoice.audioUrl);
    
    if (gameState !== 'options' || isTransitioning) return;
    if (correctChoiceIds.includes(selectedChoice.id)) return;
    
    setClickCount(prev => prev + 1);
    
    if (wrongGuesses.includes(selectedChoice.id)) {
      setIncorrectCount(prev => prev + 1);
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setWrongGuesses(prev => prev.filter(id => id !== selectedChoice.id));
      }, 1500);
      return;
    }
    
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = currentQ.targets.some(t => t.id === selectedChoice.id);
    
    if (isCorrect) {
      const newCorrectChoiceIds = [...correctChoiceIds, selectedChoice.id];
      setCorrectChoiceIds(newCorrectChoiceIds);
      setCorrectCount(prev => prev + 1);

      if (newCorrectChoiceIds.length === currentQ.targets.length) {
        setIsTransitioning(true);
        setFeedback('correct');
        if (stopwatchRef.current) {
          clearInterval(stopwatchRef.current);
        }
        
        // Log time for this question
        const timeStr = formatTimeForDB(stopwatch);
        const newLogs = currentQ.targets.map(t => ({
          photoId: t.id,
          timePerQuestion: timeStr
        }));
        setTimeLogs(prev => [...prev, ...newLogs]);

        // Play the audio and ensure at least 1.5s delay for feedback
        const delayPromise = new Promise(resolve => setTimeout(resolve, 1500));
        await Promise.all([audioPromise, delayPromise]);

        // Move to next question or end game
        setWrongGuesses([]);
        setFeedback(null);
        setCorrectChoiceIds([]);
        setIsTransitioning(false);
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setGameState('question');
        } else {
          finishGame();
        }
      } else {
        // Just show correct feedback briefly
        setFeedback('correct');
        setTimeout(() => setFeedback(null), 1000);
      }
    } else {
      setIncorrectCount(prev => prev + 1);
      setWrongGuesses(prev => [...prev, selectedChoice.id]);
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setWrongGuesses(prev => prev.filter(id => id !== selectedChoice.id));
      }, 1500);
    }
  };

  const finishGame = async () => {
    setGameState('summary');
  };

  // Save game when reaching summary
  useEffect(() => {
    if (gameState === 'summary') {
      const saveLog = async () => {
        await saveMemoryGameResult(
          Number(params.id),
          {
            totalQuestions: questions.length,
            totalAnswers: numAnswersSetting,
            displayTime: showTimeSetting,
            clickCount: clickCount,
            correctCount: correctCount,
            incorrectCount: incorrectCount
          },
          timeLogs
        );
        
        const timeStr = formatTimeMMSS(totalElapsedSeconds);
        router.push(`/user/games/summary?gameType=memory&tq=${questions.length}&c=${clickCount}&co=${correctCount}&time=${timeStr}&returnUrl=/user/games/memory/${params.id}?mode=${mode}`);
      };
      saveLog();
    }
  }, [gameState, questions.length, numAnswersSetting, showTimeSetting, clickCount, correctCount, incorrectCount, timeLogs, totalElapsedSeconds, router, params.id, mode]);

  const handleEndGame = () => {
    playClick();
    setShowExitPopup(true);
  };

  const confirmEndGame = () => {
    playClick();
    router.push(`/user/games/memory/${params.id}?mode=${mode}`);
  };

  const cancelEndGame = () => {
    playClick();
    setShowExitPopup(false);
  };

  const toggleMute = () => {
    playClick();
    setIsMuted(!isMuted);
    if (audioRef.current && !isMuted) {
      audioRef.current.pause();
    }
  };

  if (gameState === 'loading') {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader text="กำลังโหลดไฟล์ กรุณารอสักครู่..." />
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className={styles.errorContainer}>
        <h2>เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
        <button className={styles.homeBtn} onClick={confirmEndGame}>กลับไปหน้าตั้งค่า</button>
      </div>
    );
  }

  if (gameState === 'summary') {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader text="กำลังบันทึกข้อมูลผลการฝึก..." />
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  
  // Determine grid class based on actual number of answers to handle cases where choices > numAnswersSetting
  const gridClass = styles[`grid${Math.min(currentQ.choices.length, 15)}`] || styles.grid4;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.timerContainer}>
          เวลา : {formatTimeMMSS(totalElapsedSeconds)}
        </div>
        
        <div className={styles.controlsContainer}>
          <button className={styles.endGameBtn} onClick={handleEndGame}>
            <ExitIcon />
            <span>จบเกม</span>
          </button>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          ข้อ {currentQuestionIndex + 1} จาก {questions.length}
          <button className={styles.audioBtn} onClick={toggleMute}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          </button>
        </div>
        <div className={styles.progressBarWrapper}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${Math.round((currentQuestionIndex / questions.length) * 100)}%` }}
          ></div>
          <div className={styles.progressPercentText}>
            {Math.round((currentQuestionIndex / questions.length) * 100)}%
          </div>
        </div>
      </div>

      {gameState === 'question' && (
        <motion.div 
          className={styles.questionContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className={`${styles.targetsGrid} ${styles[`grid${Math.min(currentQ.targets.length, 10)}`]}`}>
            {currentQ.targets.map((target, idx) => (
              <motion.div 
                key={idx}
                className={styles.targetCard} 
                onClick={() => playAudio(target.audioUrl)}
                style={{ cursor: 'pointer' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {mode === 'word' ? (
                  <h1 className={styles.targetWord} style={{ fontSize: currentQ.targets.length > 4 ? '3rem' : '5rem' }}>{target.title}</h1>
                ) : (
                  <Image src={target.imageUrl} alt={`Target ${idx}`} width={300} height={300} priority unoptimized={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </motion.div>
            ))}
          </div>
          <div className={styles.countdownText}>
            กำลังจะหายใน {countdown}
          </div>
        </motion.div>
      )}

      {gameState === 'options' && (
        <motion.div 
          className={styles.optionsContent}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={`${styles.optionsGrid} ${gridClass}`}>
            {currentQ.choices.map((choice, index) => (
              <motion.div 
                key={index} 
                className={`${styles.optionCard} ${correctChoiceIds.includes(choice.id) ? styles.selectedCorrect : ''} ${wrongGuesses.includes(choice.id) ? styles.wrong : ''}`}
                onClick={() => handleOptionClick(choice)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={wrongGuesses.includes(choice.id) ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <Image src={choice.imageUrl} alt={`Option ${index + 1}`} width={300} height={300} priority unoptimized={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Preload Next Question Images */}
      {currentQuestionIndex < questions.length - 1 && (
        <div style={{ display: 'none' }}>
          {questions[currentQuestionIndex + 1].targets.map((t, idx) => (
             <Image key={`preload-t-${t.id}-${idx}`} src={t.imageUrl} alt={`preload target ${idx}`} width={300} height={300} priority={false} loading="eager" unoptimized={true} />
          ))}
          {questions[currentQuestionIndex + 1].choices.map((choice, idx) => (
             <Image key={`preload-c-${choice.id}-${idx}`} src={choice.imageUrl} alt={`preload choice ${idx}`} width={300} height={300} priority={false} loading="eager" unoptimized={true} />
          ))}
        </div>
      )}

      <AlertMessage type="success" show={feedback === 'correct'} />
      <AlertMessage type="error" show={feedback === 'wrong'} />

      {/* Exit Confirmation Popup */}
      <AlertMessage 
        type="confirm" 
        show={showExitPopup} 
        onConfirm={confirmEndGame} 
        onCancel={cancelEndGame} 
        line1="ต้องการออกจากเกมหรือไม่" 
        line2="" 
      />
    </div>
  );
}
