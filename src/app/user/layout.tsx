"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { getSession, signOut } from "next-auth/react";
import Loader from "@/app/components/Loader/Loader";
import AboutModal from "@/app/components/AboutModal/AboutModal";
import styles from "./user.module.css";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [sessionDay, setSessionDay] = useState<number>(0);
  const [lastActivity, setLastActivity] = useState<number>(0);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
          const nameToDisplay = user.fullName || user.name || user.id || "";
          setUserName(`คุณ ${nameToDisplay}`);
          return;
        }
      } catch (e) {
        console.error("Failed to get NextAuth session:", e);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setSessionDay(new Date().getDate());
    setLastActivity(Date.now());

    let throttleTimer: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          setLastActivity(Date.now());
          throttleTimer = null;
        }, 1000);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      const now = new Date();
      const idleTime = now.getTime() - lastActivity;
      const threeHours = 3 * 60 * 60 * 1000;
      
      // If inactive for 3 hours
      if (idleTime >= threeHours) {
         handleLogout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastActivity]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isGameInnerPage = pathname.startsWith("/user/games/") && pathname.split("/").length > 4;
  const isSummaryPage = pathname.startsWith("/user/games/summary");
  const isHistoryActive = pathname.startsWith("/user/history");
  const isGamesActive = pathname.startsWith("/user/games") && !isSummaryPage;

  return (
    <div className={`${styles.layoutContainer} ${isGameInnerPage ? styles.noBottomPadding : ''}`}>
      {!isGameInnerPage && (
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

        <nav className={`${styles.menu} ${isHistoryActive ? styles.historyActive : isGamesActive ? styles.gamesActive : ''}`}>
          <Link href="/user/games" onClick={() => handleLinkClick('/user/games')} className={`${styles.menuItem} ${isGamesActive ? styles.active : ''}`}>
            <span className={styles.menuIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
                <line x1="6" y1="12" x2="10" y2="12"></line>
                <line x1="8" y1="10" x2="8" y2="14"></line>
                <line x1="15" y1="13" x2="15.01" y2="13"></line>
                <line x1="18" y1="11" x2="18.01" y2="11"></line>
              </svg>
            </span>
            <span className={styles.menuText}>ประเภทเกม</span>
          </Link>
          <Link href="/user/history" onClick={() => handleLinkClick('/user/history')} className={`${styles.menuItem} ${isHistoryActive ? styles.active : ''}`}>
            <span className={styles.menuIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </span>
            <span className={styles.menuText}>ประวัติการฝึก</span>
          </Link>
        </nav>

        <div className={styles.sidebarBottom}>
          <button onClick={() => setIsAboutModalOpen(true)} className={styles.manualBtn} style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <span className={styles.menuIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <circle cx="8" cy="9" r="1.5" />
                <path d="M4.5 16a3.5 3.5 0 0 1 7 0" />
                <line x1="14" y1="10" x2="18" y2="10" />
                <line x1="14" y1="14" x2="18" y2="14" />
              </svg>
            </span>
            <span className={styles.manualText}>ผู้จัดทำ</span>
          </button>

          <Link href="/user/manual" onClick={() => handleLinkClick('/user/manual')} className={styles.manualBtn}>
            <span className={styles.menuIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
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
            <span className={styles.userName}>{userName}</span>
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
      )}

      {!isGameInnerPage && (
      <div className={styles.mobileHeader}>
        <div className={styles.mobileUserPill}>{userName}</div>
        <Link href="/user/games" onClick={() => handleLinkClick('/user/games')} className={styles.mobileHomeBtn} aria-label="Home">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </Link>
        <button className={styles.mobileLogoutBtn} aria-label="Logout" title="Logout" onClick={handleLogout}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
      )}

      <main className={isGameInnerPage ? styles.fullMainContent : styles.mainContent}>
        {isPageLoading ? (
          <Loader text="กำลังโหลดข้อมูล..." />
        ) : (
          children
        )}
      </main>

      {/* Mobile Manual Button */}
      {!isGameInnerPage && (
      <Link href="/user/manual" onClick={() => handleLinkClick('/user/manual')} className={styles.mobileManualBtn} aria-label="Manual">
        ?
      </Link>
      )}

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  );
}
