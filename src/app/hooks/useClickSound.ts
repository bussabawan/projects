import { useCallback, useEffect, useRef } from 'react';

export const useClickSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/audio/mouse-click-352734.mp3');
    }
  }, []);

  const playClick = useCallback(() => {
    try {
      if (audioRef.current) {
        const clone = audioRef.current.cloneNode(true) as HTMLAudioElement;
        clone.play().catch(() => {
          // Ignore if audio play fails (e.g., due to autoplay policies before user interaction)
        });
      }
    } catch {
      // Ignore errors
    }
  }, []);

  return playClick;
};
