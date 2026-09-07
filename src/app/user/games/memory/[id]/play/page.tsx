"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import styles from './memoryPlay.module.css';
import { getMemoryGameData, saveMemoryGameResult } from '@/app/actions/memoryActions';
import AlertMessage from '@/app/components/AlertMessage/AlertMessage';
import Image from 'next/image';
import Loader from '@/app/components/Loader/Loader';
import { useClickSound } from '@/app/hooks/useClickSound';

type ImageInfo = {
  id: number;
  title: string;
  imageUrl: string;
  audioUrl?: string;
};

type GameData = {
  target: ImageInfo;
  choices: ImageInfo[];
};

export default function MemoryGamePlayPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const mode = searchParams.get('mode') || 'picture';
  const numQuestionsSetting = parseInt(searchParams.get('q') || '30', 10);
  const numAnswersSetting = parseInt(searchParams.get('a') || '4', 10);
  const showTimeSetting = parseInt(searchParams.get('t') || '5', 10);

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
  const [correctChoiceId, setCorrectChoiceId] = useState<number | null>(null);
  
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
    
    const preloadImage = (url: string) => {
      assets.push(new Promise((resolve) => {
        const img = new window.Image();
        img.src = url;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      }));
    };

    const preloadAudio = (url: string) => {
      assets.push(new Promise((resolve) => {
        const audio = new window.Audio();
        const bitrate = window.innerWidth <= 425 ? 32 : 64;
        const separator = url.includes('?') ? '&' : '?';
        audio.src = `${url}${separator}bitrate=${bitrate}`;
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => resolve();
        setTimeout(resolve, 3000); // timeout for audio
      }));
    };

    questionsList.forEach(q => {
      if (q.target.imageUrl) preloadImage(q.target.imageUrl);
      if (q.target.audioUrl) preloadAudio(q.target.audioUrl);
      
      q.choices.forEach((c) => {
        if (c.imageUrl) preloadImage(c.imageUrl);
        if (c.audioUrl) preloadAudio(c.audioUrl);
      });
    });

    await Promise.all(assets);
  };

  const loadGameData = async (exerciseId: number) => {
    try {
      const result = await getMemoryGameData(exerciseId, numQuestionsSetting, numAnswersSetting);
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

  useEffect(() => {
    if (params.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadGameData(Number(params.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Handle Question Phase Timer
  useEffect(() => {
    if (gameState === 'question') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdown(showTimeSetting);
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
  }, [gameState, currentQuestionIndex, showTimeSetting]);

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

  const playAudio = (url?: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!url || isMuted) {
        resolve();
        return;
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Determine bitrate based on screen size (Mobile L: 425px)
      const bitrate = window.innerWidth <= 425 ? 32 : 64;
      const separator = url.includes('?') ? '&' : '?';
      const audioUrlWithBitrate = `${url}${separator}bitrate=${bitrate}`;
      
      const audio = new Audio(audioUrlWithBitrate);
      audioRef.current = audio;
      
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      
      audio.play().catch(e => {
        console.log("Audio play failed:", e);
        resolve();
      });
    });
  };

  // Play audio when entering question state
  useEffect(() => {
    if (gameState === 'question' && questions[currentQuestionIndex]) {
      const currentQ = questions[currentQuestionIndex];
      playAudio(currentQ.target.audioUrl);
    }
  }, [gameState, currentQuestionIndex, questions]);

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
    if (gameState !== 'options' || isTransitioning) return;
    
    setClickCount(prev => prev + 1);
    
    if (wrongGuesses.includes(selectedChoice.id)) {
      setIncorrectCount(prev => prev + 1);
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setWrongGuesses(prev => prev.filter(id => id !== selectedChoice.id));
      }, 1500);
      playAudio(selectedChoice.audioUrl);
      return;
    }
    
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = selectedChoice.id === currentQ.target.id;
    
    if (isCorrect) {
      setIsTransitioning(true);
      setFeedback('correct');
      setCorrectChoiceId(selectedChoice.id);
      if (stopwatchRef.current) {
        clearInterval(stopwatchRef.current);
      }
      
      setCorrectCount(prev => prev + 1);
      
      // Log time
      setTimeLogs(prev => [...prev, {
        photoId: currentQ.target.id,
        timePerQuestion: formatTimeForDB(stopwatch)
      }]);

      // Play the audio and ensure at least 1.5s delay for feedback
      const audioPromise = playAudio(selectedChoice.audioUrl);
      const delayPromise = new Promise(resolve => setTimeout(resolve, 1500));
      await Promise.all([audioPromise, delayPromise]);

      // Move to next question or end game
      setWrongGuesses([]);
      setFeedback(null);
      setCorrectChoiceId(null);
      setIsTransitioning(false);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setGameState('question');
      } else {
        finishGame();
      }
    } else {
      setIncorrectCount(prev => prev + 1);
      setWrongGuesses(prev => [...prev, selectedChoice.id]);
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setWrongGuesses(prev => prev.filter(id => id !== selectedChoice.id));
      }, 1500);
      playAudio(selectedChoice.audioUrl);
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
  
  // Determine grid class based on number of answers
  let gridClass = styles.grid4;
  if (numAnswersSetting === 2) gridClass = styles.grid2;
  else if (numAnswersSetting === 3) gridClass = styles.grid3;
  else if (numAnswersSetting === 5) gridClass = styles.grid5;
  else if (numAnswersSetting === 6) gridClass = styles.grid6;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.timerContainer}>
          เวลา : {formatTimeMMSS(totalElapsedSeconds)}
        </div>
        
        <div className={styles.controlsContainer}>
          <button className={styles.endGameBtn} onClick={handleEndGame}>
            จบเกม
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
            style={{ width: `${Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%` }}
          ></div>
          <div className={styles.progressPercentText}>
            {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
          </div>
        </div>
      </div>

      {gameState === 'question' && (
        <div className={styles.questionContent}>
          <div 
            className={styles.targetCard} 
            onClick={() => playAudio(currentQ.target.audioUrl)}
            style={{ cursor: 'pointer' }}
          >
            {mode === 'word' ? (
              <h1 className={styles.targetWord}>{currentQ.target.title}</h1>
            ) : (
              <Image src={currentQ.target.imageUrl} alt="Target" width={300} height={300} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}
          </div>
          <div className={styles.countdownText}>
            กำลังจะหายใน {countdown}
          </div>
        </div>
      )}

      {gameState === 'options' && (
        <div className={styles.optionsContent}>
          <div className={`${styles.optionsGrid} ${gridClass}`}>
            {currentQ.choices.map((choice, index) => (
              <div 
                key={index} 
                className={`${styles.optionCard} ${wrongGuesses.includes(choice.id) ? styles.wrong : ''} ${correctChoiceId === choice.id ? styles.selected : ''}`}
                onClick={() => handleOptionClick(choice)}
              >
                <Image src={choice.imageUrl} alt={`Option ${index + 1}`} width={300} height={300} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preload Next Question Images */}
      {currentQuestionIndex < questions.length - 1 && (
        <div style={{ display: 'none' }}>
          <Image src={questions[currentQuestionIndex + 1].target.imageUrl} alt="preload target" width={1} height={1} />
          {questions[currentQuestionIndex + 1].choices.map((choice, idx) => (
            <Image key={`preload-${choice.id}-${idx}`} src={choice.imageUrl} alt={`preload choice ${idx}`} width={1} height={1} />
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
