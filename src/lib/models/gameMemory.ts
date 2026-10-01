import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { ImageInfo } from './manageImages';
import { BaseModel } from './BaseModel';

export interface MemoryGameHistory {
  id: number;
  totalQuestions: number;
  clickCount: number;
  correctCount: number;
  testDate: Date;
}

export class GameMemoryModel extends BaseModel {
  static async getExerciseImages(exerciseId: number): Promise<ImageInfo[]> {
    const rows = await this.query<RowDataPacket>(
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

  static async getExerciseMaxAudioTime(exerciseId: number): Promise<number> {
    const rows = await this.query<RowDataPacket>(
      `SELECT MAX(pd.audio_time) as maxTime 
       FROM photo_in_exercises pie
       JOIN photo_data pd ON pie.photo_id = pd.photo_id
       WHERE pie.exercises_id = ? AND pie.remove = 0 AND pd.remove = 0`,
      [exerciseId]
    );
    return rows[0]?.maxTime || 2.5;
  }

  static async getRandomImages(limit: number, excludeIds: number[], exerciseId?: number): Promise<ImageInfo[]> {
    let query = `SELECT photo_id as id, photo_title as title, photo_name as imageUrl, audio_name as audioUrl, audio_title as audioTitle, audio_gen as audioGen
                 FROM photo_data pd WHERE remove = 0`;
    const params: (string | number)[] = [];
    let hasCategories = false;
    let categoryIds: number[] = [];

    if (exerciseId) {
      const catRows = await this.query<RowDataPacket>(
        'SELECT category_id FROM category_in_exercises WHERE exercises_id = ? AND remove = 0',
        [exerciseId]
      );
      if (catRows.length > 0) {
        hasCategories = true;
        categoryIds = catRows.map(r => r.category_id);
        const placeholders = categoryIds.map(() => '?').join(',');
        query = `SELECT DISTINCT pd.photo_id as id, pd.photo_title as title, pd.photo_name as imageUrl, pd.audio_name as audioUrl, pd.audio_title as audioTitle, pd.audio_gen as audioGen
                 FROM photo_data pd
                 JOIN photo_in_category pic ON pd.photo_id = pic.photo_id
                 WHERE pd.remove = 0 AND pic.remove = 0 AND pic.category_id IN (${placeholders})`;
        params.push(...categoryIds);
      }
    }
    
    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      query += ` AND pd.photo_id NOT IN (${placeholders})`;
      params.push(...excludeIds);
    }
    
    query += ` ORDER BY RAND() LIMIT ?`;
    params.push(limit);

    let rows = await this.query<RowDataPacket>(query, params);

    // Fallback if not enough images in the selected categories
    if (rows.length < limit && hasCategories) {
      const additionalLimit = limit - rows.length;
      const currentIds = [...excludeIds, ...rows.map(r => r.id)];
      
      let fallbackQuery = `SELECT photo_id as id, photo_title as title, photo_name as imageUrl, audio_name as audioUrl, audio_title as audioTitle, audio_gen as audioGen
                           FROM photo_data WHERE remove = 0`;
      const fallbackParams: (string | number)[] = [];
      
      if (currentIds.length > 0) {
        const placeholders = currentIds.map(() => '?').join(',');
        fallbackQuery += ` AND photo_id NOT IN (${placeholders})`;
        fallbackParams.push(...currentIds);
      }
      
      fallbackQuery += ` ORDER BY RAND() LIMIT ?`;
      fallbackParams.push(additionalLimit);
      
      const fallbackRows = await this.query<RowDataPacket>(fallbackQuery, fallbackParams);
      rows = [...rows, ...fallbackRows];
    }
    const formattedRows = rows.map((row) => ({
      ...row,
      imageUrl: row.imageUrl ? `/api/files/${row.id}?type=image&v=${encodeURIComponent(row.imageUrl)}` : "",
      audioUrl: row.audioUrl ? `/api/files/${row.id}?type=audio&v=${encodeURIComponent(row.audioUrl)}` : "",
    }));
    return formattedRows as ImageInfo[];
  }

  static async saveGameLog(
    userId: number, 
    exerciseId: number,
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
    return this.transaction(async (connection) => {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO memory_exercises_log 
         (user_id, exercises_id, total_questions, total_answers, display_time, click_count, correct_count, incorrect_count, test_date, remove) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)`,
        [userId, exerciseId, logData.totalQuestions, logData.totalAnswers, logData.displayTime, logData.clickCount, logData.correctCount, logData.incorrectCount]
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

      return true;
    });
  }

  static async getUserGameHistory(userId: number, limit: number = 7): Promise<MemoryGameHistory[]> {
    const rows = await this.query<RowDataPacket>(
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
