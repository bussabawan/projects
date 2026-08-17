import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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
  static async getImages(
    page: number = 1,
    limit: number = 12,
    search: string = "",
    prioritizeIds: number[] = []
  ): Promise<{ data: ImageInfo[]; totalPages: number }> {
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

    return {
      data: rows as ImageInfo[],
      totalPages: totalPages === 0 ? 1 : totalPages
    };
  }

  /**
   * Create a new image
   * @throws Error if title already exists (or returns a special object if deleted)
   */
  static async createImage(data: { title: string, imageUrl: string, audioUrl?: string, audioTitle?: string, audioGen?: number }): Promise<number | { isDuplicateDeleted: boolean, duplicateId: number }> {
    // Check if the title already exists (including deleted ones)
    const [existingRows] = await db.query<RowDataPacket[]>(
      `SELECT photo_id as id, remove FROM photo_data WHERE photo_title = ?`,
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
  static async updateImage(id: number, data: { title: string, imageUrl: string, audioUrl?: string, audioTitle?: string, audioGen?: number }): Promise<void> {
    // Check if title is duplicated by another image
    const [existingRows] = await db.query<RowDataPacket[]>(
      `SELECT photo_id as id FROM photo_data WHERE photo_title = ? AND photo_id != ?`,
      [data.title, id]
    );

    if (existingRows.length > 0) {
      throw new Error("มีชื่อรูปภาพนี้อยู่ในระบบแล้ว (Image title already exists)");
    }

    await db.execute(
      `UPDATE photo_data 
       SET photo_name = ?, photo_title = ?, audio_name = ?, audio_title = ?, audio_gen = ?, remove = 0 
       WHERE photo_id = ?`,
      [
        data.imageUrl, 
        data.title, 
        data.audioUrl || "", 
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
}
