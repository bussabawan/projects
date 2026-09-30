import { useEffect } from 'react';

// Global counter to track how many modals are currently open
let scrollLockCount = 0;

export function useScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (isLocked) {
      scrollLockCount++;
      if (scrollLockCount === 1) {
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      if (isLocked) {
        scrollLockCount--;
        if (scrollLockCount === 0) {
          document.body.style.overflow = '';
        }
      }
    };
  }, [isLocked]);
}
