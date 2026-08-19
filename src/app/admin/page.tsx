import styles from "./admin.module.css";
import { AdminStatsModel } from "@/lib/models/adminStats";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const stats = await AdminStatsModel.getOverviewStats();

  return (
    <>
      <h1 className={styles.pageTitle}>ภาพรวมสถิติ</h1>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>ผู้ป่วย<br/>ทั้งหมด</div>
          <div className={styles.statValue}>{stats.totalPatients}</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>หมวดหมู่<br/>ทั้งหมด</div>
          <div className={styles.statValue}>{stats.totalCategories}</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>รูปภาพ<br/>ทั้งหมด</div>
          <div className={styles.statValue}>{stats.totalPhotos}</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>ชุดแบบฝึกหัด<br/>ทั้งหมด</div>
          <div className={styles.statValue}>{stats.totalExercises}</div>
        </div>
      </div>
    </>
  );
}
