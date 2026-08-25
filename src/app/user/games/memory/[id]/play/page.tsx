"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from './memoryPlay.module.css';
import { getMemoryGameData, saveMemoryGameResult } from '@/app/actions/memoryActions';
import AlertMessage from '@/app/components/AlertMessage/AlertMessage';

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
  
  // Timers
  const [countdown, setCountdown] = useState(showTimeSetting);
  const [stopwatch, setStopwatch] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stopwatchRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (params.id) {
      loadGameData(Number(params.id));
    }
  }, [params.id]);

  const loadGameData = async (exerciseId: number) => {
    try {
      const result = await getMemoryGameData(exerciseId, numQuestionsSetting, numAnswersSetting);
      if (result.success && result.data) {
        setQuestions(result.data);
        setGameState('question');
      } else {
        setGameState('error');
      }
    } catch (error) {
      console.error("Error loading game data:", error);
      setGameState('error');
    }
  };

  // Handle Question Phase Timer
  useEffect(() => {
    if (gameState === 'question') {
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

  // Handle Options Phase Stopwatch
  useEffect(() => {
    if (gameState === 'options') {
      setStopwatch(0);
      stopwatchRef.current = setInterval(() => {
        setStopwatch((prev) => prev + 0.01);
      }, 10);
    }
    
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
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
      
      const audio = new Audio(url);
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

  const formatTime = (time: number) => {
    return time.toFixed(2);
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
    
    // If already guessed wrong, replay the sound and count as another mistake
    if (wrongGuesses.includes(selectedChoice.id)) {
      setIncorrectCount(prev => prev + 1);
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1500);
      playAudio(selectedChoice.audioUrl);
      return;
    }
    
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = selectedChoice.id === currentQ.target.id;
    
    if (isCorrect) {
      setIsTransitioning(true);
      setFeedback('correct');
      if (stopwatchRef.current) {
        clearInterval(stopwatchRef.current);
      }
      
      setCorrectCount(prev => prev + 1);
      
      // Log time
      setTimeLogs(prev => [...prev, {
        photoId: currentQ.target.id,
        timePerQuestion: formatTimeForDB(stopwatch)
      }]);

      // Play the audio of the selected choice and wait for it to finish
      await playAudio(selectedChoice.audioUrl);

      // Move to next question or end game
      setWrongGuesses([]);
      setFeedback(null);
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
      setTimeout(() => setFeedback(null), 1500);
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
      };
      saveLog();
    }
  }, [gameState]);

  const handleEndGame = () => {
    setShowExitPopup(true);
  };

  const confirmEndGame = () => {
    router.push(`/user/games/memory/${params.id}?mode=${mode}`);
  };

  const cancelEndGame = () => {
    setShowExitPopup(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current && !isMuted) {
      audioRef.current.pause();
    }
  };

  if (gameState === 'loading') {
    return <div className={styles.loadingContainer}>กำลังโหลดข้อมูลเกม...</div>;
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
      <div className={styles.summaryContainer}>
        <h2>สรุปผลการเล่น</h2>
        <div className={styles.summaryScore}>
          ตอบถูก: {correctCount} / {questions.length}
        </div>
        <p>เวลาเฉลี่ย: {(timeLogs.reduce((acc, curr) => acc + parseFloat(curr.timePerQuestion), 0) / questions.length).toFixed(2)} วินาที</p>
        <button className={styles.homeBtn} onClick={confirmEndGame}>กลับไปหน้าตั้งค่า</button>
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
        <div className={styles.progressInfo}>
          ข้อ {currentQuestionIndex + 1} จาก {questions.length}
        </div>
        
        <div className={styles.timerContainer}>
          เวลา : {gameState === 'options' ? formatTime(stopwatch) : formatTime(0)}
        </div>
        
        <div className={styles.controlsContainer}>
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
          <button className={styles.endGameBtn} onClick={handleEndGame}>
            จบเกม
          </button>
        </div>
      </div>

      {gameState === 'question' && (
        <div className={styles.questionContent}>
          <div 
            className={styles.targetCard} 
            onClick={() => playAudio(currentQ.target.audioUrl)}
            style={{ cursor: 'pointer' }}
          >
            <img src={currentQ.target.imageUrl} alt="Target" loading="lazy" />
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
                className={`${styles.optionCard} ${wrongGuesses.includes(choice.id) ? styles.wrong : ''}`}
                onClick={() => handleOptionClick(choice)}
              >
                <img src={choice.imageUrl} alt={`Option ${index + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}
      <AlertMessage type="success" show={feedback === 'correct'} />
      <AlertMessage type="error" show={feedback === 'wrong'} />

      {/* Exit Confirmation Popup */}
      {showExitPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContainer}>
            <div className={styles.popupIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div className={styles.popupText}>ต้องการออกจากเกมหรือไม่</div>
            <div className={styles.popupButtons}>
              <button className={styles.popupBtnConfirm} onClick={confirmEndGame}>ตกลง</button>
              <button className={styles.popupBtnCancel} onClick={cancelEndGame}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
