import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ImageInfo } from './manageImages';

export interface MemoryGameHistory {
  id: number;
  totalQuestions: number;
  clickCount: number;
  correctCount: number;
  testDate: Date;
}

export class GameMemoryModel {
  static async getExerciseImages(exerciseId: number): Promise<ImageInfo[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT pd.photo_id as id, pd.photo_title as title, pd.photo_name as imageUrl, pd.audio_name as audioUrl, pd.audio_title as audioTitle, pd.audio_gen as audioGen
       FROM photo_in_exercises pie
       JOIN photo_data pd ON pie.photo_id = pd.photo_id
       WHERE pie.exercises_id = ? AND pie.remove = 0 AND pd.remove = 0`,
      [exerciseId]
    );
    const formattedRows = rows.map((row) => ({
      ...row,
      imageUrl: row.imageUrl ? `/api/files/${row.id}?type=image&v=${encodeURIComponent(row.imageUrl)}` : "",
      audioUrl: row.audioUrl ? `/api/files/${row.id}?type=audio&v=${encodeURIComponent(row.audioUrl)}` : "",
    }));
    return formattedRows as ImageInfo[];
  }

  static async getRandomImages(limit: number, excludeIds: number[]): Promise<ImageInfo[]> {
    let query = `SELECT photo_id as id, photo_title as title, photo_name as imageUrl, audio_name as audioUrl, audio_title as audioTitle, audio_gen as audioGen
                 FROM photo_data WHERE remove = 0`;
    const params: (string | number)[] = [];
    
    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      query += ` AND photo_id NOT IN (${placeholders})`;
      params.push(...excludeIds);
    }
    
    query += ` ORDER BY RAND() LIMIT ?`;
    params.push(limit);

    const [rows] = await db.query<RowDataPacket[]>(query, params);
    const formattedRows = rows.map((row) => ({
      ...row,
      imageUrl: row.imageUrl ? `/api/files/${row.id}?type=image&v=${encodeURIComponent(row.imageUrl)}` : "",
      audioUrl: row.audioUrl ? `/api/files/${row.id}?type=audio&v=${encodeURIComponent(row.audioUrl)}` : "",
    }));
    return formattedRows as ImageInfo[];
  }

  static async saveGameLog(
    userId: number, 
    logData: {
      totalQuestions: number;
      totalAnswers: number;
      displayTime: number;
      clickCount: number;
      correctCount: number;
      incorrectCount: number;
    }, 
    timeLogs: {
      photoId: number;
      timePerQuestion: string;
    }[]
  ): Promise<boolean> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO memory_exercises_log 
         (user_id, total_questions, total_answers, display_time, click_count, correct_count, incorrect_count, test_date, remove) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0)`,
        [userId, logData.totalQuestions, logData.totalAnswers, logData.displayTime, logData.clickCount, logData.correctCount, logData.incorrectCount]
      );

      const memoryId = result.insertId;

      if (timeLogs && timeLogs.length > 0) {
        for (const timeLog of timeLogs) {
          await connection.query(
            `INSERT INTO memory_question_time_log 
             (id_memory, photo_id, time_per_question, remove) 
             VALUES (?, ?, ?, 0)`,
            [memoryId, timeLog.photoId, timeLog.timePerQuestion]
          );
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error("Failed to save memory game log:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getUserGameHistory(userId: number, limit: number = 7): Promise<MemoryGameHistory[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id_memory as id, total_questions as totalQuestions, click_count as clickCount, correct_count as correctCount, test_date as testDate
       FROM memory_exercises_log 
       WHERE user_id = ? AND remove = 0
       ORDER BY test_date DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows.reverse() as MemoryGameHistory[];
  }
}
