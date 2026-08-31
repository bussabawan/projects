"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

export default function Footer() {
  const pathname = usePathname() || '';

  // ตรวจสอบว่าอยู่ในหน้าหลักของ User หรือ Admin หรือไม่
  // หน้าหลัก User: /user/* ที่ไม่ใช่หน้าเล่นเกม (length <= 4)
  const isUserMainPage = pathname.startsWith('/user') && (!pathname.startsWith('/user/games/') || pathname.split('/').length <= 4);
  const isAdminPage = pathname.startsWith('/admin');
  
  // ถ้าไม่ใช่หน้าหลัก (เช่น /login, หน้าเล่นเกม, ตั้งค่าเกม, สรุปคะแนน) ให้ footer ชิดขวาล่าง
  const isCornerPage = !(isUserMainPage || isAdminPage);

  return (
    <div className={`${styles.footerContainer} ${isCornerPage ? styles.cornerFixed : ''}`}>
      <div className={styles.footerText}>
        © 2026 ระบบ........ (OT) | ความร่วมมือระหว่าง โรงพยาบาลเวชชารักษ์ ลำปาง และ มหาวิทยาลัยราชภัฏลำปาง
      </div>
      <div className={styles.footerLinks}>
        <Link href="https://www.vjlh.go.th/about/structureIT" target="_blank" rel="noopener noreferrer">
          เงื่อนไขการให้บริการ | นโยบายความเป็นส่วนตัว
        </Link>
      </div>
    </div>
  );
}
