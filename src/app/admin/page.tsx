import styles from "./admin.module.css";
import { AdminStatsModel } from "@/lib/models/adminStats";
import DashboardCharts from "./DashboardCharts";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const stats = await AdminStatsModel.getOverviewStats();
  const usageStats = await AdminStatsModel.getSystemUsageStats();
  const imageCategoryStats = await AdminStatsModel.getImageCategoryStats();
  const exerciseCategoryStats = await AdminStatsModel.getExerciseCategoryStats();

  return (
    <>
      <h1 className={styles.pageTitle}>ภาพรวมสถิติ</h1>
      
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statCardHeader}>
            <div className={`${styles.statIcon} ${styles.statIcon1}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <div className={styles.statLabel}>ผู้ป่วยทั้งหมด</div>
          <div className={styles.statValue}>{stats.totalPatients}</div>
        </div>
        
        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statCardHeader}>
            <div className={`${styles.statIcon} ${styles.statIcon2}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
            </div>
          </div>
          <div className={styles.statLabel}>หมวดหมู่ทั้งหมด</div>
          <div className={styles.statValue}>{stats.totalCategories}</div>
        </div>
        
        <div className={`${styles.statCard} ${styles.statCard3}`}>
          <div className={styles.statCardHeader}>
            <div className={`${styles.statIcon} ${styles.statIcon3}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
          </div>
          <div className={styles.statLabel}>รูปภาพทั้งหมด</div>
          <div className={styles.statValue}>{stats.totalPhotos}</div>
        </div>
        
        <div className={`${styles.statCard} ${styles.statCard4}`}>
          <div className={styles.statCardHeader}>
            <div className={`${styles.statIcon} ${styles.statIcon4}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>
            </div>
          </div>
          <div className={styles.statLabel}>ชุดแบบฝึกหัดทั้งหมด</div>
          <div className={styles.statValue}>{stats.totalExercises}</div>
        </div>
      </div>

      <DashboardCharts 
        usageStats={usageStats} 
        imageCategoryStats={imageCategoryStats} 
        exerciseCategoryStats={exerciseCategoryStats} 
      />
      

    </>
  );
}
