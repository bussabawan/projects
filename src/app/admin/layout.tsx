"use client";

import { useState, useEffect, useCallback } from "react";
import { getSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import styles from "./admin.module.css";
import { usePathname } from "next/navigation";
import Skeleton from "@/app/components/Skeleton/Skeleton";
import AboutModal from "@/app/components/AboutModal/AboutModal";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [userName, setUserName] = useState("กำลังโหลด...");
  const pathname = usePathname();

  useEffect(() => {
    setIsPageLoading(false);
  }, [pathname]);

  const handleLinkClick = (href: string) => {
    if (pathname !== href) {
      setIsPageLoading(true);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await getSession();
        if (session && session.user) {
          const user = session.user as Record<string, unknown>;
          setUserName(`คุณ ${user.fullName || user.name || "Admin"}`);
          return;
        }
      } catch (e) {
        console.error("Failed to get NextAuth session:", e);
      }
      
      setUserName("Admin");
    };

    fetchUser();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut({ callbackUrl: '/login' });
    } catch {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("ไม่มีการเคลื่อนไหวเกิน 5 นาที กำลังออกจากระบบ...");
        handleLogout();
      }, 300000);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    resetTimeout();

    events.forEach(event => {
      window.addEventListener(event, resetTimeout);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [handleLogout]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={styles.layoutContainer}>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
        <button className={styles.toggleBtn} onClick={toggleSidebar} aria-label="Toggle Sidebar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <Image 
              src="/vejjarak_logo.webp" 
              alt="Vejjarak Lampang Hospital Logo" 
              width={150} 
              height={77} 
              priority
            />
          </div>
        </div>

        <nav className={styles.menu}>
          <Link href="/admin" onClick={() => handleLinkClick('/admin')} className={`${styles.menuItem} ${pathname === '/admin' ? styles.active : ''}`}>
            <span className={styles.menuIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            </span>
            <span className={styles.menuText}>ภาพรวมสถิติ</span>
          </Link>
          <Link href="/admin/patient-stats" onClick={() => handleLinkClick('/admin/patient-stats')} className={`${styles.menuItem} ${pathname === '/admin/patient-stats' ? styles.active : ''}`}>
            <span className={styles.menuIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </span>
            <span className={styles.menuText}>สถิติผู้ป่วยรายบุคคล</span>
          </Link>
          <Link href="/admin/users" onClick={() => handleLinkClick('/admin/users')} className={`${styles.menuItem} ${pathname === '/admin/users' ? styles.active : ''}`}>
            <span className={styles.menuIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </span>
            <span className={styles.menuText}>จัดการผู้ใช้</span>
          </Link>
          <Link href="/admin/images" onClick={() => handleLinkClick('/admin/images')} className={`${styles.menuItem} ${pathname === '/admin/images' ? styles.active : ''}`}>
            <span className={styles.menuIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </span>
            <span className={styles.menuText}>จัดการรูปภาพ</span>
          </Link>
          <Link href="/admin/exercises" onClick={() => handleLinkClick('/admin/exercises')} className={`${styles.menuItem} ${pathname === '/admin/exercises' ? styles.active : ''}`}>
            <span className={styles.menuIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            </span>
            <span className={styles.menuText}>จัดการแบบฝึก</span>
          </Link>
        </nav>

        <div className={styles.sidebarBottom}>
          <button onClick={() => setIsAboutModalOpen(true)} className={styles.manualBtn} style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <span className={styles.menuIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <circle cx="8" cy="9" r="1.5" />
                <path d="M4.5 16a3.5 3.5 0 0 1 7 0" />
                <line x1="14" y1="10" x2="18" y2="10" />
                <line x1="14" y1="14" x2="18" y2="14" />
              </svg>
            </span>
            <span className={styles.manualText}>ผู้จัดทำ</span>
          </button>

          <Link href="/admin/manual" onClick={() => handleLinkClick('/admin/manual')} className={styles.manualBtn}>
            <span className={styles.menuIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </span>
            <span className={styles.manualText}>คู่มือ</span>
          </Link>
          
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              <svg viewBox="0 0 24 24" width="35" height="35" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className={styles.userName}>{userName}</div>
            <button className={styles.logoutBtn} aria-label="Logout" title="Logout" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {isPageLoading ? (
          <div style={{ padding: '2rem', width: '100%' }}>
            <Skeleton type="table" count={5} />
          </div>
        ) : (
          children
        )}
      </main>
      
      <Link href="/admin/manual" onClick={() => handleLinkClick('/admin/manual')} className={styles.mobileManualBtn} aria-label="คู่มือ">
        ?
      </Link>
      
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  );
}
