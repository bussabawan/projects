"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AboutModal from '@/app/components/AboutModal/AboutModal';
import styles from './Footer.module.css';

interface FooterProps {
  inline?: boolean;
}

export default function Footer({ inline = false }: FooterProps) {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const pathname = usePathname() || '';

  // ตรวจสอบว่าอยู่ในหน้าหลักของ User หรือ Admin หรือไม่
  // หน้าหลัก User: /user/* ที่ไม่ใช่หน้าเล่นเกม (length <= 4)
  const isUserMainPage = pathname.startsWith('/user') && (!pathname.startsWith('/user/games/') || pathname.split('/').length <= 4);
  const isAdminPage = pathname.startsWith('/admin');
  
  // ถ้าไม่ใช่หน้าหลัก (เช่น /login, หน้าเล่นเกม, ตั้งค่าเกม, สรุปคะแนน) ให้ footer ชิดขวาล่าง
  const isCornerPage = !(isUserMainPage || isAdminPage);

  const isUserPage = pathname.startsWith('/user');

  return (
    <div
      className={`
        ${styles.footerContainer}
        ${inline ? styles.inlineFooter : ''}
        ${isCornerPage && !inline ? styles.cornerFixed : ''}
        ${!inline && isUserPage ? styles.hideOnMobile : ''}
      `}
    >
      <div className={styles.footerText}>
        © 2026 ระบบ<span className={styles.dots}>&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;.&#8203;</span> (OT)
      </div>
      <div className={styles.footerText}>
        ความร่วมมือระหว่าง โรงพยาบาลเวชชารักษ์ ลำปาง มหาวิทยาลัยราชภัฏลำปาง และ วิทยาลัยเทคนิคนครลำปาง
      </div>
      <div className={styles.footerLinks}>
        <Link href="https://www.vjlh.go.th/about/structureIT" target="_blank" rel="noopener noreferrer">
          เงื่อนไขการให้บริการ | นโยบายความเป็นส่วนตัว
        </Link>
        <span className={styles.mobileCreatorsWrapper}>
          {" | "}
          <button
            onClick={() => setIsAboutModalOpen(true)}
            className={styles.mobileCreatorsInlineBtn}
            type="button"
          >
            เกี่ยวกับผู้จัดทำ
          </button>
        </span>
      </div>
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  );
}
