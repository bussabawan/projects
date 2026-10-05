/**
 * ข้อมูลจำลองสำหรับตาราง photo_data, photo_in_category, photo_in_exercises
 * อิงตาม schema จาก dump-ot_cogkit_db.sql
 */

export interface MockPhotoData {
  photo_id: number;
  photo_name: string;
  photo_title: string;
  audio_name: string;
  audio_time: number | null;
  audio_title: string;
  audio_gen: number;
  remove: number;
}

export const mockPhotos: MockPhotoData[] = [
  {
    photo_id: 1,
    photo_name: 'dog.jpg',
    photo_title: 'สุนัข',
    audio_name: 'dog.mp3',
    audio_time: 1.5,
    audio_title: 'สุนัข',
    audio_gen: 1,
    remove: 0
  },
  {
    photo_id: 2,
    photo_name: 'cat.jpg',
    photo_title: 'แมว',
    audio_name: 'cat.mp3',
    audio_time: 1.2,
    audio_title: 'แมว',
    audio_gen: 1,
    remove: 0
  },
  {
    photo_id: 3,
    photo_name: 'bird.jpg',
    photo_title: 'นก',
    audio_name: 'bird.mp3',
    audio_time: 1.0,
    audio_title: 'นก',
    audio_gen: 1,
    remove: 0
  },
  {
    photo_id: 4,
    photo_name: 'apple.jpg',
    photo_title: 'แอปเปิ้ล',
    audio_name: 'apple.mp3',
    audio_time: 1.1,
    audio_title: 'แอปเปิ้ล',
    audio_gen: 1,
    remove: 0
  },
  {
    photo_id: 5,
    photo_name: 'deleted_photo.jpg',
    photo_title: 'ภาพที่ถูกลบ',
    audio_name: 'deleted.mp3',
    audio_time: null,
    audio_title: 'ภาพที่ถูกลบ',
    audio_gen: 0,
    remove: 1
  }
];

export const mockPhotoInCategory = [
  { id: 1, category_id: 1, photo_id: 1, remove: 0 },
  { id: 2, category_id: 1, photo_id: 2, remove: 0 },
  { id: 3, category_id: 1, photo_id: 3, remove: 0 },
  { id: 4, category_id: 2, photo_id: 4, remove: 0 }
];

export const mockPhotoInExercises = [
  { id: 1, exercises_id: 1, photo_id: 1, remove: 0 },
  { id: 2, exercises_id: 1, photo_id: 2, remove: 0 },
  { id: 3, exercises_id: 1, photo_id: 3, remove: 0 },
  { id: 4, exercises_id: 2, photo_id: 4, remove: 0 }
];
