/**
 * ข้อมูลจำลองสำหรับตาราง users_data, patient_data, login_logs
 * อิงตาม schema จาก dump-ot_cogkit_db.sql
 */

export interface MockUserData {
  user_id: number;
  user_name: string;
  full_name: string;
  password: string;
  role: number; // 1 = ผู้ป่วย, 2 = Admin
  login_quota: number;
  update_time: Date;
  remove: number; // 0 = ไม่ลบ, 1 = ลบ
}

export const mockUsers: MockUserData[] = [
  {
    user_id: 1,
    user_name: 'admin',
    full_name: 'ผู้ดูแลระบบสูงสุด',
    password: '$2a$10$hashedpasswordforadmin',
    role: 2, // Admin
    login_quota: 0,
    update_time: new Date('2026-10-01T00:00:00.000Z'),
    remove: 0
  },
  {
    user_id: 10,
    user_name: 'patient01',
    full_name: 'นายสมชาย ใจดี (ผู้ป่วย)',
    password: '$2a$10$hashedpasswordforpatient01',
    role: 1, // ผู้ป่วย
    login_quota: 10,
    update_time: new Date('2026-10-01T00:00:00.000Z'),
    remove: 0
  },
  {
    user_id: 11,
    user_name: 'patient_deleted',
    full_name: 'ผู้ป่วยที่ถูกลบ',
    password: '$2a$10$hashedpasswordforpatientdeleted',
    role: 1,
    login_quota: 0,
    update_time: new Date('2026-10-01T00:00:00.000Z'),
    remove: 1 // Soft deleted
  }
];

export const mockPatientAssignments = [
  {
    patient_id: 1,
    user_id: 10,
    exercises_id: 1,
    remove: 0
  },
  {
    patient_id: 2,
    user_id: 10,
    exercises_id: 2,
    remove: 0
  }
];

export const mockLoginLogs = [
  {
    id: 1,
    user_id: 10,
    login_time: new Date('2026-10-01T08:30:00.000Z')
  }
];
