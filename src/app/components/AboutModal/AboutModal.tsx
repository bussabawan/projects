"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import BaseModal from '../BaseModal/BaseModal';
import styles from './AboutModal.module.css';
import { useScrollLock } from "@/app/hooks/useScrollLock";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  useScrollLock(isOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const title = (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#8a2be2' }}>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <circle cx="8" cy="9" r="1.5" />
        <path d="M4.5 16a3.5 3.5 0 0 1 7 0" />
        <line x1="14" y1="10" x2="18" y2="10" />
        <line x1="14" y1="14" x2="18" y2="14" />
      </svg>
      <span style={{ color: '#8a2be2' }}>เกี่ยวกับผู้จัดทำ ปี 2569</span>
    </>
  );

  return createPortal(
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      maxWidth="900px"
    >
      <div className={styles.modalBody}>
        {/* Section 1: COOPERATION */}
          <div className={styles.section}>
            <div className={styles.coopTitle}>COOPERATION BETWEEN</div>
            <div className={styles.logosContainer}>
              <div className={styles.logoItem}>
                <div className={styles.logoText}>โรงพยาบาลเวชชารักษ์ ลำปาง</div>
                <Image src="/vejjarak_logo.webp" alt="Vejjarak Logo" width={120} height={120} style={{ objectFit: 'contain' }} />
              </div>
              <div className={styles.ampersand}></div>
              <div className={styles.logoItem}>
                <div className={styles.logoText}>มหาวิทยาลัยราชภัฏลำปาง</div>
                <Image src="/lprulogo.webp" alt="LPRU Logo" width={120} height={120} style={{ objectFit: 'contain' }} />
              </div>
              <div className={styles.ampersand}></div>
              <div className={styles.logoItem}>
                <div className={styles.logoText}>วิทยาลัยเทคนิคนครลำปาง</div>
                <Image src="/nltc_logo.webp" alt="NLTC Logo" width={120} height={120} style={{ objectFit: 'contain' }} />
              </div>
            </div>
          </div>

          {/* Section 2: Students */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                นักศึกษาสหกิจศึกษา
              </div>
              <div className={styles.sectionDivider}></div>
            </div>
          
            <div className={styles.cardsContainer}>
              <div className={`${styles.cardWrapper} ${styles.twoCols}`}>
                <div className={styles.subTitle}>ผู้พัฒนาโปรแกรม</div>
                <div className={styles.profileCard}>
                  <div className={styles.avatarCircle}>
                    <Image src="/profile1.webp?v=2" alt="นางสาวบุษบาวรรณ ลาพิงค์" width={100} height={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} quality={100}/>
                  </div>
                  <div className={styles.profileName}>นางสาวบุษบาวรรณ ลาพิงค์</div>
                  <div className={styles.profileTitle}>สาขาวิศวกรรมซอฟต์แวร์<br/>คณะเทคโนโลยีสารอุตสหากรรม<br/>มหาวิทยาลัยราชภัฏลำปาง<br/>bussabawanlaping@gmail.com</div>
                </div>
              </div>

              <div className={`${styles.cardWrapper} ${styles.twoCols}`}>
                <div className={styles.subTitle}>ผู้จัดเตรียมข้อมูลระบบ</div>
                <div className={styles.profileCard}>
                  <div className={styles.avatarCircle}>
                    <Image src="/profile2.webp?v=2" alt="นายอภิรักษ์ เทพธรรม" width={100} height={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} quality={100}/>
                  </div>
                  <div className={styles.profileName}>นายอภิรักษ์ เทพธรรม</div>
                  <div className={styles.profileTitle}>สาขาวิชาเทคโนโลยีสารสนเทศ<br/>วิทยาลัยเทคนิคนครลำปาง<br/>aphiraktheptham@gmail.com</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Experts */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderTitle} style={{ color: '#8a2be2' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                ผู้เชี่ยวชาญ / ที่ปรึกษา
              </div>
              <div className={styles.sectionDivider}></div>
            </div>
            
            <div className={styles.cardsContainer}>
              <div className={`${styles.profileCard} ${styles.twoCols}`}>
                <div className={styles.avatarCircle}>
                  <Image src="/specialist-2.webp?v=2" alt="นางสาวเขมินทรา พันธุ์บุญปลูก" width={250} height={250} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} quality={100}/>
                </div>
                <div className={styles.profileName}>นางสาวเขมินทรา พันธุ์บุญปลูก</div>
                <div className={styles.profileTitle}>นักกิจกรรมบำบัดชำนาญการ<br/>รองผู้อำนวยการด้านการพัฒนาระบบสุขภาพ</div>
              </div>
              <div className={`${styles.profileCard} ${styles.twoCols}`}>
                <div className={styles.avatarCircle}>
                  <Image src="/specialist-4.webp?v=2" alt="นายชุติพงศ์ หาญยุทธ" width={250} height={250} style={{ width: '100%', height: '100%', objectFit: 'cover' }} quality={100}/>
                </div>
                <div className={styles.profileName}>นายชุติพงศ์ หาญยุทธ</div>
                <div className={styles.profileTitle}>นักวิชาการคอมพิวเตอร์ปฏิบัติการ</div>
              </div>
              <div className={`${styles.profileCard} ${styles.twoCols}`}>
                <div className={styles.avatarCircle}>
                  <Image src="/specialist-3.webp?v=2" alt="นางสาวณิชชารีย์ ชีวรัตนาพันธ์" width={250} height={250} style={{ width: '100%', height: '100%', objectFit: 'cover' }} quality={100}/>
                </div>
                <div className={styles.profileName}>นางสาวณิชชารีย์ ชีวรัตนาพันธ์</div>
                <div className={styles.profileTitle}>นักกิจกรรมบำบัด</div>
              </div>
            </div>
          </div>
      </div>
    </BaseModal>,
    document.body
  );
}

