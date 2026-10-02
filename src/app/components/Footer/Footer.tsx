"use client";

import { useState } from 'react';
import Link from 'next/link';
import AboutModal from '@/app/components/AboutModal/AboutModal';
import styles from './Footer.module.css';

export default function Footer() {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.divider}></div>
      <div className={styles.footerContent}>
        <div className={styles.left}>
          <span className={styles.desktopText}>
            © 2026 Cog-kit : ระบบฝึกการรับรู้ด้านสมาธิและความจำ | ความร่วมมือระหว่างโรงพยาบาลเวชชารักษ์ ลำปาง มหาวิทยาลัยราชภัฏลำปาง และ วิทยาลัยเทคนิคนครลำปาง
          </span>
          <span className={styles.mobileText}>
            © 2026 Cog-kit<br />
            ระบบฝึกการรับรู้ด้านสมาธิและความจำ<br />
            ความร่วมมือระหว่างโรงพยาบาลเวชชารักษ์ ลำปาง<br />
            มหาวิทยาลัยราชภัฏลำปาง<br />
            และ วิทยาลัยเทคนิคนครลำปาง
          </span>
        </div>
        <div className={styles.right}>
          <button onClick={() => setIsAboutModalOpen(true)} className={`${styles.linkBtn} ${styles.mobileOnlyAbout}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            เกี่ยวกับผู้จัดทำ
          </button>
          <Link href="https://www.vjlh.go.th/about/structureIT" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            เงื่อนไขการให้บริการ
          </Link>
          <Link href="https://www.vjlh.go.th/about/structureIT" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            นโยบายความเป็นส่วนตัว
          </Link>
        </div>
      </div>
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </footer>
  );
}
