import styles from "./admin.module.css";

export default function AdminPage() {
  return (
    <>
      <h1 className={styles.pageTitle}>ภาพรวมสถิติ</h1>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>ผู้ป่วยทั้งหมด</div>
          <div className={styles.statValue}>123</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>หมวดหมู่ทั้งหมด</div>
          <div className={styles.statValue}>123</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>รูปภาพทั้งหมด</div>
          <div className={styles.statValue}>123</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>ชุดแบบฝึกหัดทั้งหมด</div>
          <div className={styles.statValue}>123</div>
        </div>
      </div>
    </>
  );
}
