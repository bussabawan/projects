import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// โหลด Environment variables จาก .env
dotenv.config();

/**
 * สคริปต์สำหรับ Reset และ Initialize ฐานข้อมูลทดสอบโดยใช้ DDL จาก dump-ot_cogkit_db.sql
 */
export async function setupTestDatabase() {
  console.log('========================================================');
  console.log('🔄 เริ่มต้นติดตั้งโครงสร้างฐานข้อมูลทดสอบจาก dump-ot_cogkit_db.sql');
  console.log('========================================================');

  const host = process.env.TEST_MYSQL_HOST || process.env.MYSQL_HOST || '127.0.0.1';
  const resolvedHost = host === 'localhost' ? '127.0.0.1' : host;
  const user = process.env.TEST_MYSQL_USER || process.env.MYSQL_USER || 'admin';
  const password = process.env.TEST_MYSQL_PASSWORD || process.env.MYSQL_PASSWORD || 'password';
  const port = Number(process.env.TEST_MYSQL_PORT || process.env.MYSQL_PORT || 3306);
  const testDbName = process.env.TEST_MYSQL_DATABASE || 'ot_cogkit_test_db';

  console.log(`📡 เชื่อมต่อไปยัง MySQL Server: ${resolvedHost}:${port} (User: ${user})`);

  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection({
      host: resolvedHost,
      user,
      password,
      port,
      multipleStatements: true
    });

    console.log(`🔨 สร้างหรือรีเซ็ตฐานข้อมูลทดสอบ: ${testDbName}`);
    await connection.query(`DROP DATABASE IF EXISTS \`${testDbName}\`;`);
    await connection.query(`CREATE DATABASE \`${testDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${testDbName}\`;`);

    // อ่านคำสั่ง SQL DDL จาก dump-ot_cogkit_db.sql
    const sqlDumpPath = path.resolve(process.cwd(), 'dump-ot_cogkit_db.sql');
    if (!fs.existsSync(sqlDumpPath)) {
      throw new Error(`ไม่พบไฟล์ Schema DDL ที่: ${sqlDumpPath}`);
    }

    console.log(`📄 กำลังอ่านไฟล์: ${sqlDumpPath}`);
    const sqlContent = fs.readFileSync(sqlDumpPath, 'utf8');

    console.log('⚙️ กำลังประมวลผลคำสั่ง DDL สร้าง 13 ตารางและ Foreign Key Constraints...');
    await connection.query(sqlContent);

    // ตรวจสอบความถูกต้องของตารางที่สร้างขึ้น
    const [rows] = await connection.query<mysql.RowDataPacket[]>('SHOW TABLES;');
    const tableNames = rows.map(r => Object.values(r)[0]);
    console.log(`✅ ติดตั้งตารางสำเร็จทั้งหมด ${tableNames.length} ตาราง:`);
    tableNames.forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`);
    });

    console.log('========================================================');
    console.log('🎉 ฐานข้อมูลทดสอบพร้อมใช้งานสำหรับการรัน Automated Tests แล้ว!');
    console.log('========================================================');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการติดตั้งฐานข้อมูลทดสอบ:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// อนุญาตให้รันโดยตรงผ่าน CLI (เช่น `npx tsx scripts/setup-test-db.ts`)
if (require.main === module || process.argv[1]?.includes('setup-test-db')) {
  setupTestDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
