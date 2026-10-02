/**
 * ข้อมูลจำลองสำหรับตาราง exercises_data, category_data, category_in_exercises
 * อิงตาม schema จาก dump-ot_cogkit_db.sql
 */

export interface MockCategoryData {
  category_id: number;
  category_name: string;
  remove: number;
}

export interface MockExerciseData {
  exercises_id: number;
  exercises_name: string;
  remove: number;
}

export const mockCategories: MockCategoryData[] = [
  { category_id: 1, category_name: 'สัตว์', remove: 0 },
  { category_id: 2, category_name: 'ผลไม้', remove: 0 },
  { category_id: 3, category_name: 'ยานพาหนะ', remove: 0 },
  { category_id: 4, category_name: 'หมวดหมู่ที่ถูกลบ', remove: 1 }
];

export const mockExercises: MockExerciseData[] = [
  { exercises_id: 1, exercises_name: 'แบบฝึกหัดชุดที่ 1 (สัตว์ทั่วไป)', remove: 0 },
  { exercises_id: 2, exercises_name: 'แบบฝึกหัดชุดที่ 2 (ผลไม้เพื่อสุขภาพ)', remove: 0 },
  { exercises_id: 3, exercises_name: 'แบบฝึกหัดชุดที่ถูกลบ', remove: 1 }
];

export const mockCategoryInExercises = [
  { id: 1, exercises_id: 1, category_id: 1, remove: 0 },
  { id: 2, exercises_id: 2, category_id: 2, remove: 0 }
];
