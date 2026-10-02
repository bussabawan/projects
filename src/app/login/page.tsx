'use client';

import Image from 'next/image';
import styles from './login.module.css';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import AboutModal from '@/app/components/AboutModal/AboutModal';
import Loader from '@/app/components/Loader/Loader';
import Footer from '@/app/components/Footer/Footer';

const maxAttemptsErrorMsg = (
  <>
    คุณใส่รหัสผิดเกิน 10 ครั้ง <br />
    กรุณาติดต่อโรงพยาบาลเวชชารักษ์ ลำปาง <br />
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
    โทร 0-5401-9662 ต่อ 411
  </>
);

function LoginContent() {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameEmpty, setUsernameEmpty] = useState(false);
  const [passwordEmpty, setPasswordEmpty] = useState(false);
  const [error, setError] = useState<string | React.ReactNode>('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const errParam = searchParams.get('error');
      if (errParam === 'AccessDenied') {
        setError('คุณไม่มีสิทธิ์เข้าใช้งาน หรือบัญชีนี้ไม่ใช่สำหรับเจ้าหน้าที่');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const handleUsernameBlur = async () => {
    if (username.trim()) {
      const quotaInfo = await checkUserLoginQuota(username.trim());
      if (quotaInfo.isLocked) {
        setIsAccountLocked(true);
        setError(maxAttemptsErrorMsg);
      } else {
        setIsAccountLocked(false);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let hasError = false;
    if (!username) {
      setUsernameEmpty(true);
      hasError = true;
    }
    if (!password) {
      setPasswordEmpty(true);
      hasError = true;
    }
    
    if (hasError) return;

    setLoading(true);

    try {
      const trimmedUsername = username.trim();

      // Pre-check if account is already locked in DB
      const preCheck = await checkUserLoginQuota(trimmedUsername);
      if (preCheck.isLocked) {
        setIsAccountLocked(true);
        setError(maxAttemptsErrorMsg);
        setLoading(false);
        return;
      }

      const res = await signIn('credentials', {
        redirect: false,
        username: trimmedUsername,
        password,
      });

      if (res?.error) {
        let code = res.code || res.error;

        // If code is generic CredentialsSignin, check quota via server action to get exact DB state
        if (code === 'CredentialsSignin' || !code.startsWith('REMAINING_')) {
          const quotaInfo = await checkUserLoginQuota(trimmedUsername);
          if (quotaInfo.isLocked) {
            code = 'LOCKED_MAX_ATTEMPTS';
          } else {
            code = `REMAINING_${quotaInfo.remaining}`;
          }
        }

        if (code === 'LOCKED_MAX_ATTEMPTS') {
          setIsAccountLocked(true);
          setError(maxAttemptsErrorMsg);
        } else if (code === 'STAFF_GOOGLE_ONLY') {
          setError('เจ้าหน้าที่กรุณาเข้าสู่ระบบผ่าน E-mail (Google) เท่านั้น');
        } else if (code.startsWith('REMAINING_')) {
          const remaining = code.replace('REMAINING_', '');
          setError(
            <>
              Username หรือ Password ไม่ถูกต้อง หากเป็นเจ้าหน้าที่กรุณาเข้าสู่ระบบผ่านบัญชี Google <br />
              (เหลือโอกาสอีก {remaining} ครั้ง)
            </>
          );
        } else {
          setError('Username หรือ Password ไม่ถูกต้อง');
        }
        setLoading(false);
      } else if (res?.ok) {
        // Successful login
        router.push('/');
        router.refresh(); // Force refresh to update layout session state
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Image
          src="/vejjarak_logo.webp"
          alt="Vejjarak Hospital Logo"
          width={350}
          height={180}
          className={styles.logo}
          priority
        />
      </div>

      <div className={styles.card}>
        {loading ? (
          <Loader text="กำลังเข้าสู่ระบบ..." />
        ) : (
          <>
            <h1 className={styles.title}>เข้าสู่ระบบ</h1>
            <h3 className={styles.subtitle}>Cog-kit : ระบบฝึกการรับรู้ด้านสมาธิและความจำ</h3>
            <form className={styles.form} onSubmit={handleLogin} noValidate>
              {error && (
                <div className={styles.errorAlert}>
                  <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              <div className={styles.inputGroup}>
                <label htmlFor="username" className={styles.label}>Username</label>
                <input 
                  type="text" 
                  id="username" 
                  className={`${styles.input} ${usernameEmpty ? styles.inputError : ''}`}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameEmpty(false);
                  }}
                  onBlur={handleUsernameBlur}
                  placeholder={usernameEmpty ? 'โปรดกรอก Username' : ''}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <input 
                  type="password" 
                  id="password" 
                  className={`${styles.input} ${passwordEmpty ? styles.inputError : ''}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordEmpty(false);
                  }}
                  placeholder={passwordEmpty ? 'โปรดกรอก Password' : ''}
                />
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.loginBtn} disabled={loading || isAccountLocked}>
                  {loading ? 'Logging in...' : 'Log in'}
                </button>
                <button 
                  type="button" 
                  className={styles.googleBtn} 
                  aria-label="Log in with Google"
                  onClick={() => {
                    setLoading(true);
                    signIn('google', { callbackUrl: '/' });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="40px" height="40px">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                  </svg>
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      
      {/* Spacer to force scroll */}
      <div style={{ flex: 1, minHeight: '15vh' }}></div>

      <div style={{ width: 'calc(100% + 2rem)', marginLeft: '-1rem', marginRight: '-1rem', marginBottom: '-1rem', marginTop: 'auto' }}>
        <Footer alwaysShowAbout={true} />
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<Loader text="กำลังโหลด..." />}>
      <LoginContent />
    </Suspense>
  );
}
