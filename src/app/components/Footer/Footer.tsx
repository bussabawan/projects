"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AboutModal from '@/app/components/AboutModal/AboutModal';
import styles from './Footer.module.css';

export default function Footer() {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const pathname = usePathname() || '';

  // ตรวจสอบว่าอยู่ในหน้าหลักของ User หรือ Admin หรือไม่
  // หน้าหลัก User: /user/* ที่ไม่ใช่หน้าเล่นเกม (length <= 4)
  const isUserMainPage = pathname.startsWith('/user') && (!pathname.startsWith('/user/games/') || pathname.split('/').length <= 4);
  const isAdminPage = pathname.startsWith('/admin');
  
  // ถ้าไม่ใช่หน้าหลัก (เช่น /login, หน้าเล่นเกม, ตั้งค่าเกม, สรุปคะแนน) ให้ footer ชิดขวาล่าง
  const isCornerPage = !(isUserMainPage || isAdminPage);

  // ซ่อน footer ในหน้าเล่นเกมและหน้าสรุปผล *เฉพาะบนมือถือ* เพื่อไม่ให้ทับกับเนื้อหา

  return (
    <div className={`${styles.footerContainer} ${isCornerPage ? styles.cornerFixed : ''} ${isAdminPage ? styles.adminFooterMobile : ''}`}>
      <div className={styles.mobileCreatorsContainer}>
        <button onClick={() => setIsAboutModalOpen(true)} className={styles.mobileCreatorsLink} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="3" />
            <circle cx="8" cy="9" r="1.5" />
            <path d="M4.5 16a3.5 3.5 0 0 1 7 0" />
            <line x1="14" y1="10" x2="18" y2="10" />
            <line x1="14" y1="14" x2="18" y2="14" />
          </svg>
          เกี่ยวกับผู้จัดทำ
        </button>
      </div>
      <hr className={styles.mobileDivider} />
      <div className={styles.footerText}>
        © 2026 Cog-kit<span className={styles.desktopOnly}> : </span><span className={styles.mobileBreak}></span>ระบบฝึกการรับรู้ด้านสมาธิและความจำ
      </div>
      <div className={styles.footerText}>
        ความร่วมมือระหว่าง<span className={styles.desktopOnly}> </span><span className={styles.mobileBreak}></span>
        โรงพยาบาลเวชชารักษ์ ลำปาง<span className={styles.desktopOnly}> </span><span className={styles.mobileBreak}></span>
        มหาวิทยาลัยราชภัฏลำปาง<span className={styles.desktopOnly}> </span><span className={styles.mobileBreak}></span>
        และ วิทยาลัยเทคนิคนครลำปาง
      </div>
      <div className={styles.footerLinks}>
        <Link href="https://www.vjlh.go.th/about/structureIT" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
          เงื่อนไขการให้บริการ<span className={styles.desktopOnly}> | </span><span className={styles.mobileBreak}></span>
          นโยบายความเป็นส่วนตัว
        </Link>
      </div>
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  );
}
