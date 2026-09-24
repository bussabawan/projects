"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

import styles from './matchingGame.module.css';
import { getGameData, saveMatchingGameResult } from '@/app/actions/matchingActions';
import AlertMessage from '@/app/components/AlertMessage/AlertMessage';
import Image from 'next/image';
import Loader from '@/app/components/Loader/Loader';
import { useClickSound } from '@/app/hooks/useClickSound';
import { motion} from 'framer-motion';

// Global cache for audio objects to prevent double loading
const audioCache = new Map<string, HTMLAudioElement>();

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

// Exit / End Game Icon SVG
const ExitIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
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
  const [wrongChoiceId, setWrongChoiceId] = useState<number | null>(null);
  const [correctChoiceId, setCorrectChoiceId] = useState<number | null>(null);
  
  // Log state
  const [clickCount, setClickCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [timeLogs, setTimeLogs] = useState<{photoId: number, timePerQuestion: string}[]>([]);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number>(0);
  
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playClick = useClickSound();

  // Format timer MM.SS
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}.${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playAudio = (url?: string) => {
    // 1. หยุดเสียงเก่าทุกกรณี (จำเป็นสำหรับบางเบราว์เซอร์เพื่อให้เริ่มเล่นใหม่ได้)
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // 2. ถ้าไม่มีเสียงใหม่ให้เล่น หรือปิดเสียงอยู่ ให้จบการทำงาน
    if (!url || isMuted) return;
    
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
    
    // 4. เล่นเสียง
    audio.play().catch(() => {});
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

  const preloadAssets = async (questionsList: Question[]) => {
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
      if (q.target.audioUrl) preloadAudio(q.target.audioUrl);
      if (q.target.imageUrl) preloadImage(q.target.imageUrl);
      
      q.choices.forEach((c) => {
        if (c.audioUrl) preloadAudio(c.audioUrl);
        if (c.imageUrl) preloadImage(c.imageUrl);
      });
    });

    await Promise.all(assets);
  };

  // Fetch data
  useEffect(() => {
    if (!exerciseId) return;

    const fetchGameData = async () => {
      setLoading(true);
      const result = await getGameData(exerciseId, numQuestions, numAnswers);
      if (result.success && result.data) {
        setQuestions(result.data);
        await preloadAssets(result.data);
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
          }
          const bitrate = window.innerWidth <= 425 ? 32 : 64;
          const separator = currentQ.target.audioUrl!.includes('?') ? '&' : '?';
          const audioUrlWithBitrate = `${currentQ.target.audioUrl}${separator}bitrate=${bitrate}`;
          
          let audio = audioCache.get(audioUrlWithBitrate);
          // Bulletproof: ป้องกัน Cache พังจาก Hot-reload
          if (!audio || !audio.src || audio.src === "" || audio.src === window.location.href) {
            audio = new window.Audio(audioUrlWithBitrate);
            audioCache.set(audioUrlWithBitrate, audio);
          }
          
          try {
            audio.currentTime = 0;
          } catch {}
          
          audioRef.current = audio;
          audio.play().catch(() => {});
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
    playClick();
    playAudio(audioUrl);
    if (feedback !== null || isFinished) return; // Prevent clicking while showing feedback

    setClickCount(prev => prev + 1);

    const currentQ = questions[currentIndex];
    
    if (choiceId === currentQ.target.id) {
      setFeedback('correct');
      setCorrectChoiceId(choiceId);
      setCorrectCount(prev => prev + 1);
      
      // eslint-disable-next-line react-hooks/purity
      const questionTimeSecs = Math.floor((Date.now() - currentQuestionStartTime) / 1000);
      const timePerQuestion = formatHHMMSS(questionTimeSecs);
      setTimeLogs(prev => [...prev, { photoId: currentQ.target.id, timePerQuestion }]);
      
      setTimeout(() => {
        setFeedback(null);
        setCorrectChoiceId(null);
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setCurrentQuestionStartTime(Date.now());
        } else {
          setIsFinished(true);
        }
      }, 1500);
    } else {
      setFeedback('wrong');
      setWrongChoiceId(choiceId);
      setIncorrectCount(prev => prev + 1);
      setTimeout(() => {
        setFeedback(null);
        setWrongChoiceId(null);
      }, 1500);
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
        await saveMatchingGameResult(exerciseId, logData, timeLogs);
        
        const timeStr = formatTime(elapsedSeconds);
        router.push(`/user/games/summary?tq=${questions.length}&c=${clickCount}&co=${correctCount}&time=${timeStr}&returnUrl=/user/games/matching/${exerciseId}?type=${type}`);
      };
      saveData();
    }
  }, [isFinished, questions.length, currentIndex, clickCount, correctCount, incorrectCount, timeLogs, elapsedSeconds, router, exerciseId, type]);

  const handleEndGame = () => {
    playClick();
    setShowExitPopup(true);
  };

  const confirmEndGame = () => {
    playClick();
    router.push(`/user/games/matching/${exerciseId}?type=${type}`);
  };

  const cancelEndGame = () => {
    playClick();
    setShowExitPopup(false);
  };

  const toggleMute = () => {
    playClick();
    setIsMuted(!isMuted);
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
    }
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader text="กำลังโหลดไฟล์ กรุณารอสักครู่..." />
      </div>
    );
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
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader text="กำลังบันทึกข้อมูลผลการฝึก..." />
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
          <button className={styles.endGameBtn} onClick={handleEndGame}>
            <ExitIcon />
            <span>จบเกม</span>
          </button>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressContainer}>
          <div className={styles.progressText}>
            ข้อ {currentIndex + 1} จาก {questions.length}
          </div>
          <button className={styles.audioBtn} onClick={toggleMute} aria-label="Toggle Audio">
            <VolumeIcon isMuted={isMuted} />
          </button>
        </div>
        <div className={styles.progressBarWrapper}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${Math.round((currentIndex / questions.length) * 100)}%` }}
          ></div>
          <div className={styles.progressPercentText}>
            {Math.round((currentIndex / questions.length) * 100)}%
          </div>
        </div>
      </div>

      <div className={styles.gameArea}>
        <motion.div 
          className={styles.targetContainer} 
          onClick={() => playAudio(currentQ.target.audioUrl)}
          style={{ cursor: currentQ.target.audioUrl && !isMuted ? 'pointer' : 'default' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          key={`target-${currentIndex}`}
        >
          {type === 'word' ? (
            <div className={styles.wordTarget}>
              <span className={styles.wordText}>{currentQ.target.title}</span>
            </div>
          ) : (
            <Image 
              src={currentQ.target.imageUrl} 
              alt="Target" 
              className={styles.targetImage} 
              width={400}
              height={400}
              priority
              unoptimized={true}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.png';
                e.currentTarget.srcset = '';
              }}
            />
          )}
        </motion.div>

        <div className={styles.choicesContainer} style={{ gridTemplateColumns: numAnswers > 4 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)' }}>
          {currentQ.choices.map((choice, idx) => (
            <motion.div 
              key={`${choice.id}-${idx}`} 
              className={`${styles.choiceBox} ${correctChoiceId === choice.id ? styles.correctChoice : ''} ${wrongChoiceId === choice.id ? styles.wrongChoice : ''}`}
              onClick={() => handleChoiceClick(choice.id, choice.audioUrl)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                wrongChoiceId === choice.id 
                  ? { opacity: 1, scale: 1, x: [-10, 10, -10, 10, 0] } 
                  : { opacity: 1, scale: 1 }
              }
              transition={{ duration: 0.4 }}
            >
              <Image 
                src={choice.imageUrl} 
                alt={`Choice ${idx + 1}`} 
                className={styles.choiceImage} 
                width={400}
                height={400}
                priority
                unoptimized={true}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                  e.currentTarget.srcset = '';
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Preload Next Question Images */}
      {currentIndex < questions.length - 1 && (
        <div style={{ display: 'none' }}>
          <Image src={questions[currentIndex + 1].target.imageUrl} alt="preload target" width={400} height={400} priority={false} loading="eager" unoptimized={true} />
          {questions[currentIndex + 1].choices.map((choice, idx) => (
            <Image key={`preload-${choice.id}-${idx}`} src={choice.imageUrl} alt={`preload choice ${idx}`} width={400} height={400} priority={false} loading="eager" unoptimized={true} />
          ))}
        </div>
      )}

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
