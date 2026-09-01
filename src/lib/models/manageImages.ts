import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { unstable_cache } from 'next/cache';

export interface ImageInfo {
  id: number;
  title: string;
  imageUrl: string;
  audioUrl?: string;
  audioTitle?: string;
  audioGen?: number;
}

export class ManageImagesModel {
  /**
   * Get all active images
   */
  static getImages = unstable_cache(
    async (
      page: number = 1,
      limit: number = 12,
      search: string = "",
      prioritizeIds: number[] = []
    ): Promise<{ data: ImageInfo[]; totalPages: number }> => {
      const offset = (page - 1) * limit;
      const queryParams: (string | number)[] = [];
      const countParams: (string | number)[] = [];

      let whereClause = "WHERE remove = 0";
      if (search) {
        whereClause += " AND LOWER(photo_title) COLLATE utf8mb4_bin LIKE LOWER(?) COLLATE utf8mb4_bin";
        queryParams.push(`%${search}%`);
        countParams.push(`%${search}%`);
      }

      // Get total count
      const [countRows] = await db.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM photo_data ${whereClause}`,
        countParams
      );
      const totalCount = countRows[0].total;
      const totalPages = Math.ceil(totalCount / limit);

      let orderClause = "ORDER BY photo_id DESC";
      if (prioritizeIds.length > 0) {
        const idsStr = prioritizeIds.map(() => '?').join(',');
        orderClause = `ORDER BY CASE WHEN photo_id IN (${idsStr}) THEN 0 ELSE 1 END ASC, photo_id DESC`;
      }

      const finalParams: (string | number)[] = [];
      if (search) {
        finalParams.push(`%${search}%`);
      }
      if (prioritizeIds.length > 0) {
        finalParams.push(...prioritizeIds);
      }
      finalParams.push(limit, offset);

      // Get paginated data
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT photo_id as id, photo_title as title, photo_name as imageUrl, audio_name as audioUrl, audio_title as audioTitle, audio_gen as audioGen
         FROM photo_data 
         ${whereClause} 
         ${orderClause} 
         LIMIT ? OFFSET ?`,
        finalParams
      );

      const formattedRows = rows.map((row) => ({
        ...row,
        imageUrl: row.imageUrl ? `/api/files/${row.id}?type=image` : "",
        audioUrl: row.audioUrl ? `/api/files/${row.id}?type=audio` : "",
      }));

      return {
        data: formattedRows as ImageInfo[],
        totalPages: totalPages === 0 ? 1 : totalPages
      };
    },
    ['ManageImagesModel-getImages'],
    { tags: ['images'] }
  );

  /**
   * Create a new image
   * @throws Error if title already exists (or returns a special object if deleted)
   */
  static async createImage(data: { title: string, imageUrl: string, audioUrl?: string, audioTitle?: string, audioGen?: number }): Promise<number | { isDuplicateDeleted: boolean, duplicateId: number }> {
    // Check if the title already exists (including deleted ones)
    const [existingRows] = await db.query<RowDataPacket[]>(
      `SELECT photo_id as id, remove FROM photo_data WHERE photo_title COLLATE utf8mb4_bin = ?`,
      [data.title]
    );

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      if (existing.remove === 1) {
        // Return a special object indicating it was deleted and can be restored
        return { isDuplicateDeleted: true, duplicateId: existing.id };
      } else {
        throw new Error("มีชื่อรูปภาพนี้อยู่ในระบบแล้ว (Image title already exists)");
      }
    }

    // Insert into database
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO photo_data (photo_name, photo_title, audio_name, audio_title, audio_gen, remove) 
       VALUES (?, ?, ?, ?, ?, 0)`,
      [
        data.imageUrl, 
        data.title, 
        data.audioUrl || "", 
        data.audioTitle || "", 
        data.audioGen ? 1 : 0
      ]
    );

    return result.insertId;
  }

  /**
   * Update an existing image
   * @throws Error if new title already exists for another image
   */
  static async updateImage(id: number, data: { title: string, imageUrl: string, audioUrl?: string, audioTitle?: string, audioGen?: number }): Promise<void | { isDuplicateDeleted: boolean, duplicateId: number }> {
    // Check if title is duplicated by another image
    const [existingRows] = await db.query<RowDataPacket[]>(
      `SELECT photo_id as id, remove FROM photo_data WHERE photo_title COLLATE utf8mb4_bin = ? AND photo_id != ?`,
      [data.title, id]
    );

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      if (existing.remove === 1) {
        return { isDuplicateDeleted: true, duplicateId: existing.id };
      } else {
        throw new Error("มีชื่อรูปภาพนี้อยู่ในระบบแล้ว (Image title already exists)");
      }
    }

    await db.execute(
      `UPDATE photo_data 
       SET 
         photo_name = IF(? LIKE '/api/files/%', photo_name, ?), 
         photo_title = ?, 
         audio_name = IF(? LIKE '/api/files/%', audio_name, ?), 
         audio_title = ?, 
         audio_gen = ?, 
         remove = 0 
       WHERE photo_id = ?`,
      [
        data.imageUrl, data.imageUrl,
        data.title, 
        data.audioUrl || "", data.audioUrl || "",
        data.audioTitle || "", 
        data.audioGen ? 1 : 0,
        id
      ]
    );
  }

  /**
   * Soft delete an image
   */
  static async deleteImage(id: number): Promise<void> {
    await db.execute(
      `UPDATE photo_data SET remove = 1 WHERE photo_id = ?`,
      [id]
    );
  }

  /**
   * Get file data (image/audio) by id for API file serving
   */
  static async getFileDataById(id: number): Promise<{ photo_name: string, audio_name: string } | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT photo_name, audio_name FROM photo_data WHERE photo_id = ? AND remove = 0`,
      [id]
    );
    if (rows.length === 0) return null;
    return {
      photo_name: rows[0].photo_name,
      audio_name: rows[0].audio_name
    };
  }
}
