import styles from "./admin.module.css";

export default function AdminPage() {
  return (
    <>
      <h1 className={styles.pageTitle}>ภาพรวมสถิติ</h1>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>ผู้ป่วย<br/>ทั้งหมด</div>
          <div className={styles.statValue}>159</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>หมวดหมู่<br/>ทั้งหมด</div>
          <div className={styles.statValue}>159</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>รูปภาพ<br/>ทั้งหมด</div>
          <div className={styles.statValue}>159</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>ชุดแบบฝึกหัด<br/>ทั้งหมด</div>
          <div className={styles.statValue}>159</div>
        </div>
      </div>
    </>
  );
}
