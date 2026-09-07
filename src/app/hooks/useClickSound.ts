import { useCallback } from 'react';

export const useClickSound = () => {
  const playClick = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Settings for a subtle, quick "click" sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.04);
      
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // Ignore if audio context fails (e.g., due to autoplay policies before user interaction)
    }
  }, []);

  return playClick;
};
