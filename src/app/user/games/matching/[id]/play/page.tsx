"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

import styles from './matchingGame.module.css';
import { getGameData, saveMatchingGameResult } from '@/app/actions/matchingActions';
import AlertMessage from '@/app/components/AlertMessage/AlertMessage';

// Volume Icon SVG
const VolumeIcon = ({ isMuted }: { isMuted: boolean }) => (
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
);

interface Choice {
  id: number;
  title: string;
  imageUrl: string;
  audioUrl?: string;
}

interface Question {
  target: Choice;
  choices: Choice[];
}

export default function MatchingGamePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const type = searchParams.get('type') || 'image';
  const numQuestions = parseInt(searchParams.get('q') || '30', 10);
  const numAnswers = parseInt(searchParams.get('a') || '4', 10);
  const exerciseId = Number(params.id);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Timer state
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  // Game state
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showExitPopup, setShowExitPopup] = useState(false);
  
  // Log state
  const [clickCount, setClickCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [timeLogs, setTimeLogs] = useState<{photoId: number, timePerQuestion: string}[]>([]);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number>(0);
  
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const playAudio = (url?: string) => {
    if (!url || isMuted) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(e => console.error('Audio play failed:', e));
  };

  // Timer effect
  useEffect(() => {
    if (loading || isFinished || feedback !== null) return;
    
    if (startTime === 0) {
      const now = Date.now();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStartTime(now);
      setCurrentQuestionStartTime(now);
    }

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [loading, isFinished, feedback, startTime]);

  // Fetch data
  useEffect(() => {
    if (!exerciseId) return;

    const fetchGameData = async () => {
      setLoading(true);
      const result = await getGameData(exerciseId, numQuestions, numAnswers);
      if (result.success && result.data) {
        setQuestions(result.data);
      } else {
        setError(result.error || 'Failed to load game');
      }
      setLoading(false);
    };

    fetchGameData();
  }, [exerciseId, numQuestions, numAnswers]);

  // Autoplay audio when question changes or game starts
  useEffect(() => {
    if (questions.length > 0 && !isMuted && !isFinished) {
      const currentQ = questions[currentIndex];
      if (currentQ?.target?.audioUrl) {
        const timer = setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
          }
          const audio = new Audio(currentQ.target.audioUrl);
          audioRef.current = audio;
          audio.play().catch(e => console.warn('Audio autoplay blocked by browser:', e));
        }, 500); // Small delay allows UI to render first and helps with browser autoplay policies
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, questions, isMuted, isFinished]);

  const formatHHMMSS = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChoiceClick = (choiceId: number, audioUrl?: string) => {
    if (feedback !== null || isFinished) return; // Prevent clicking while showing feedback

    playAudio(audioUrl);
    setClickCount(prev => prev + 1);

    const currentQ = questions[currentIndex];
    
    if (choiceId === currentQ.target.id) {
      setFeedback('correct');
      setCorrectCount(prev => prev + 1);
      
      // eslint-disable-next-line react-hooks/purity
      const questionTimeSecs = Math.floor((Date.now() - currentQuestionStartTime) / 1000);
      const timePerQuestion = formatHHMMSS(questionTimeSecs);
      setTimeLogs(prev => [...prev, { photoId: currentQ.target.id, timePerQuestion }]);
      
      setTimeout(() => {
        setFeedback(null);
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setCurrentQuestionStartTime(Date.now());
        } else {
          setIsFinished(true);
        }
      }, 1000);
    } else {
      setFeedback('wrong');
      setIncorrectCount(prev => prev + 1);
      setTimeout(() => {
        setFeedback(null);
      }, 1000);
    }
  };

  // Save data when finished
  useEffect(() => {
    if (isFinished) {
      const saveData = async () => {
        const logData = {
          totalQuestions: questions.length,
          totalAnswers: currentIndex + 1,
          clickCount,
          correctCount,
          incorrectCount
        };
        await saveMatchingGameResult(logData, timeLogs);
      };
      saveData();
    }
  }, [isFinished, questions.length, currentIndex, clickCount, correctCount, incorrectCount, timeLogs]);

  const handleEndGame = () => {
    setShowExitPopup(true);
  };

  const confirmEndGame = () => {
    router.push(`/user/games/matching/${exerciseId}?type=${type}`);
  };

  const cancelEndGame = () => {
    setShowExitPopup(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Format timer MM.SS
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}.${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>กำลังโหลดเกม...</div></div>;
  }

  if (error || questions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          {error || 'ไม่พบข้อมูลคำถาม'}
          <br />
          <button className={styles.endGameBtn} onClick={confirmEndGame} style={{marginTop: '20px'}}>กลับ</button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className={styles.container}>
        <div className={styles.loading} style={{flexDirection: 'column', gap: '20px'}}>
          <h1>จบเกม!</h1>
          <p>เวลาที่ใช้: {formatTime(elapsedSeconds)}</p>
          <button className={styles.endGameBtn} onClick={confirmEndGame}>กลับไปหน้าตั้งค่า</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className={styles.container}>
      <AlertMessage type="success" show={feedback === 'correct'} />
      <AlertMessage type="error" show={feedback === 'wrong'} />

      <div className={styles.header}>
        <div className={styles.timer}>
          เวลา : {formatTime(elapsedSeconds)}
        </div>
        <div className={styles.headerRight}>
          <button className={styles.audioBtnDesktop} onClick={toggleMute} aria-label="Toggle Audio">
            <VolumeIcon isMuted={isMuted} />
          </button>
          <button className={styles.endGameBtn} onClick={handleEndGame}>
            จบเกม
          </button>
        </div>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressText}>
          ข้อ {currentIndex + 1} จาก {questions.length}
        </div>
        <button className={styles.audioBtnMobile} onClick={toggleMute} aria-label="Toggle Audio">
          <VolumeIcon isMuted={isMuted} />
        </button>
      </div>

      <div className={styles.gameArea}>
        <div 
          className={styles.targetContainer} 
          onClick={() => playAudio(currentQ.target.audioUrl)}
          style={{ cursor: currentQ.target.audioUrl && !isMuted ? 'pointer' : 'default' }}
        >
          {type === 'word' ? (
            <div className={styles.wordTarget}>
              <span className={styles.wordText}>{currentQ.target.title}</span>
            </div>
          ) : (
            <img 
              src={currentQ.target.imageUrl} 
              alt="Target" 
              className={styles.targetImage} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+Not+Found';
              }}
            />
          )}
        </div>

        <div className={styles.choicesContainer} style={{ gridTemplateColumns: numAnswers > 4 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)' }}>
          {currentQ.choices.map((choice, idx) => (
            <div 
              key={`${choice.id}-${idx}`} 
              className={styles.choiceBox}
              onClick={() => handleChoiceClick(choice.id, choice.audioUrl)}
            >
              <img 
                src={choice.imageUrl} 
                alt={`Choice ${idx + 1}`} 
                className={styles.choiceImage} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Image+Not+Found';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Preload Next Question Images */}
      {currentIndex < questions.length - 1 && (
        <div style={{ display: 'none' }}>
          <img src={questions[currentIndex + 1].target.imageUrl} alt="preload target" />
          {questions[currentIndex + 1].choices.map((choice, idx) => (
            <img key={`preload-${choice.id}-${idx}`} src={choice.imageUrl} alt={`preload choice ${idx}`} />
          ))}
        </div>
      )}

      {/* Exit Confirmation Popup */}
      {showExitPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContainer}>
            <div className={styles.popupIcon}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
