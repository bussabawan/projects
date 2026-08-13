"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { getSession, signOut } from "next-auth/react";
import styles from "./user.module.css";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName, setUserName] = useState("User");
  const pathname = usePathname();
  const router = useRouter();

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
              src="/api/uploads/vejjarak_logo.png" 
              alt="Vejjarak Lampang Hospital Logo" 
              width={90} 
              height={90} 
            />
          </div>
          <div className={styles.hospitalName}>โรงพยาบาลเวชชารักษ์ ลำปาง</div>
          <div className={styles.hospitalNameEn}>VEJJARAK LAMPANG HOSPITAL</div>
        </div>

        <nav className={styles.menu}>
          <Link href="/user/games" className={`${styles.menuItem} ${pathname === '/user/games' ? styles.active : ''}`}>
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
          <Link href="/user/history" className={`${styles.menuItem} ${pathname.startsWith('/user/history') ? styles.active : ''}`}>
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
          <Link href="/user/manual" className={styles.manualBtn}>
            <span className={styles.menuIcon} style={{ display: isCollapsed ? 'flex' : 'none' }}>
              <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8l4 4-4 4M16 12H8"></path>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <div className={styles.mobileHeader}>
        <div className={styles.mobileUserPill}>{userName}</div>
        <Link href="/user/games" className={styles.mobileHomeBtn} aria-label="Home">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </Link>
        <button className={styles.mobileLogoutBtn} aria-label="Logout" title="Logout" onClick={handleLogout}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 16 16 12 12 8"></polyline>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
      </div>

      <main className={styles.mainContent}>
        {children}
      </main>

      {/* Mobile Manual Button */}
      <Link href="/user/manual" className={styles.mobileManualBtn} aria-label="Manual">
        ?
      </Link>
    </div>
  );
}
