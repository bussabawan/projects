'use client';

import { useState, useEffect } from 'react';
import styles from './CookieBanner.module.css';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cookieConsent = localStorage.getItem('cookieConsent');
      if (!cookieConsent) {
        setIsVisible(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={styles.cookieBanner}>
      <div className={styles.contentWrapper}>
        <div className={styles.textContainer}>
          เราใช้คุกกี้เพื่อเพิ่มประสบการณ์และความพึงพอใจในการใช้งานเว็บไซต์ หากคุณกด &quot;ยอมรับ&quot; หรือใช้งานเว็บไซต์ของเราต่อ ถือว่าคุณยินยอมให้มีการใช้งานคุกกี้
          <a 
            href="https://www.vjlh.go.th/pdf/cookies/CookiesPolicy2567.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.link}
          >
            [อ่านเพิ่มเติม]
          </a>
        </div>
        <button onClick={handleAccept} className={styles.acceptButton}>
          ยอมรับ
        </button>
      </div>
    </div>
  );
}
