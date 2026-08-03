"use client";

import { useState, useEffect } from "react";
import { getSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import styles from "./admin.module.css";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName, setUserName] = useState("กำลังโหลด...");
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      // Check for user in localStorage first
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.role === 2) {
            setUserName(`คุณ ${user.fullName || user.username}`);
            return;
          }
        } catch {
        // Handle error silently
        }
      }
      
      // Fallback to NextAuth session (for Google login)
      try {
        const session = await getSession();
        if (session && session.user) {
          const user = session.user as Record<string, unknown>;
          if (user.role === 2) {
            setUserName(`คุณ ${user.fullName || user.name}`);
            return;
          }
          // If role is missing but we have a session, we can still show their name
          setUserName(`คุณ ${user.fullName || user.name}`);
          return;
        }
      } catch (e) {
        console.error("Failed to get NextAuth session:", e);
      }
      
      // Default if no login data found
      setUserName("Admin");
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('user');
    // We can also redirect here, but we will try next-auth signOut first
    try {
      const { signOut } = await import('next-auth/react');
      await signOut({ callbackUrl: '/login' });
    } catch {
      window.location.href = '/login';
    }
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
              src="/uploads/vejjarak_logo.png" 
              alt="Vejjarak Lampang Hospital Logo" 
              width={90} 
              height={90} 
            />
          </div>
          <div className={styles.hospitalName}>โรงพยาบาลเวชชารักษ์ ลำปาง</div>
          <div className={styles.hospitalNameEn}>VEJJARAK LAMPANG HOSPITAL</div>
        </div>

        <nav className={styles.menu}>
          <Link href="/admin" className={`${styles.menuItem} ${pathname === '/admin' ? styles.active : ''}`}>
            <span className={styles.menuIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            </span>
            <span className={styles.menuText}>ภาพรวมสถิติ</span>
          </Link>
          <Link href="/admin/patient-stats" className={`${styles.menuItem} ${pathname === '/admin/patient-stats' ? styles.active : ''}`}>
            <span className={styles.menuIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </span>
            <span className={styles.menuText}>สถิติผู้ป่วยรายบุคคล</span>
          </Link>
          <Link href="/admin/users" className={`${styles.menuItem} ${pathname === '/admin/users' ? styles.active : ''}`}>
            <span className={styles.menuIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </span>
            <span className={styles.menuText}>จัดการผู้ใช้</span>
          </Link>
          <Link href="/admin/images" className={`${styles.menuItem} ${pathname === '/admin/images' ? styles.active : ''}`}>
            <span className={styles.menuIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </span>
            <span className={styles.menuText}>จัดการรูปภาพ</span>
          </Link>
          <Link href="/admin/exercises" className={`${styles.menuItem} ${pathname === '/admin/exercises' ? styles.active : ''}`}>
            <span className={styles.menuIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            </span>
            <span className={styles.menuText}>จัดการแบบฝึก</span>
          </Link>
        </nav>

        <div className={styles.sidebarBottom}>
          <Link href="/admin/manual" className={styles.manualBtn}>
            <span className={styles.menuIcon} style={{ display: isCollapsed ? 'flex' : 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </span>
            <span className={styles.manualText}>คู่มือ</span>
          </Link>
          
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className={styles.userName}>{userName}</div>
            <button className={styles.logoutBtn} aria-label="Logout" title="Logout" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8l4 4-4 4M16 12H8"></path>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
      
      <Link href="/admin/manual" className={styles.mobileManualBtn} aria-label="คู่มือ">
        ?
      </Link>
    </div>
  );
}
