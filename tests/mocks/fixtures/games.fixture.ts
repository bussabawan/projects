/**
 * ข้อมูลจำลองสำหรับตาราง matching_exercises_log, matching_question_time_log,
 * memory_exercises_log, memory_question_time_log
 * อิงตาม schema จาก dump-ot_cogkit_db.sql
 */

export interface MockMatchingLog {
  id_matching: number;
  user_id: number;
  exercises_id: number;
  total_questions: number;
  total_answers: number;
  click_count: number;
  correct_count: number;
  incorrect_count: number;
  test_date: Date;
  remove: number;
}

export interface MockMatchingTimeLog {
  id_time: number;
  id_matching: number;
  photo_id: number;
  time_per_question: string; // TIME format e.g. "00:00:03"
  remove: number;
}

export interface MockMemoryLog {
  id_memory: number;
  user_id: number;
  exercises_id: number;
  total_questions: number;
  total_answers: number;
  display_time: number;
  click_count: number;
  correct_count: number;
  incorrect_count: number;
  test_date: Date;
  remove: number;
}

export interface MockMemoryTimeLog {
  id_time: number;
  id_memory: number;
  photo_id: number;
  time_per_question: string;
  remove: number;
}

export const mockMatchingLogs: MockMatchingLog[] = [
  {
    id_matching: 1,
    user_id: 10,
    exercises_id: 1,
    total_questions: 3,
    total_answers: 3,
    click_count: 4,
    correct_count: 3,
    incorrect_count: 1,
    test_date: new Date('2026-10-01T09:00:00.000Z'),
    remove: 0
  }
];

export const mockMatchingTimeLogs: MockMatchingTimeLog[] = [
  { id_time: 1, id_matching: 1, photo_id: 1, time_per_question: '00:00:02', remove: 0 },
  { id_time: 2, id_matching: 1, photo_id: 2, time_per_question: '00:00:04', remove: 0 },
  { id_time: 3, id_matching: 1, photo_id: 3, time_per_question: '00:00:03', remove: 0 }
];

export const mockMemoryLogs: MockMemoryLog[] = [
  {
    id_memory: 1,
    user_id: 10,
    exercises_id: 1,
    total_questions: 2,
    total_answers: 2,
    display_time: 3,
    click_count: 5,
    correct_count: 2,
    incorrect_count: 1,
    test_date: new Date('2026-10-01T09:30:00.000Z'),
    remove: 0
  }
];

export const mockMemoryTimeLogs: MockMemoryTimeLog[] = [
  { id_time: 1, id_memory: 1, photo_id: 1, time_per_question: '00:00:05', remove: 0 },
  { id_time: 2, id_memory: 1, photo_id: 2, time_per_question: '00:00:06', remove: 0 }
];
