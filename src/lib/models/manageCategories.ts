import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { unstable_cache } from 'next/cache';

export interface CategoryInfo {
  category_id: number;
  category_name: string;
}

export class ManageCategoriesModel {
  /**
   * Get all categories for dropdown selection
   */
  static getCategories = unstable_cache(
    async (): Promise<CategoryInfo[]> => {
      const [rows] = await db.execute<RowDataPacket[]>(
        'SELECT category_id, category_name FROM category_data WHERE remove = 0 ORDER BY category_id ASC'
      );
      return rows as CategoryInfo[];
    },
    ['ManageCategoriesModel-getCategories'],
    { tags: ['categories'] }
  );

  /**
   * Get paginated list of categories with search
   */
  static getCategoriesPaginated = unstable_cache(
    async (page: number, limit: number, search: string = ''): Promise<{ data: CategoryInfo[], total: number }> => {
      const offset = (page - 1) * limit;
      let baseQuery = 'SELECT category_id, category_name FROM category_data WHERE remove = 0';
      let countQuery = 'SELECT COUNT(category_id) as total FROM category_data WHERE remove = 0';
      const queryParams: (string | number)[] = [];
      
      if (search) {
        const searchPattern = `%${search}%`;
        baseQuery += ' AND LOWER(category_name) COLLATE utf8mb4_bin LIKE LOWER(?) COLLATE utf8mb4_bin';
        countQuery += ' AND LOWER(category_name) COLLATE utf8mb4_bin LIKE LOWER(?) COLLATE utf8mb4_bin';
        queryParams.push(searchPattern);
      }
      
      baseQuery += ' ORDER BY category_id DESC LIMIT ? OFFSET ?';
      
      const [rows] = await db.query<RowDataPacket[]>(baseQuery, [...queryParams, limit, offset]);
      const [countRows] = await db.query<RowDataPacket[]>(countQuery, queryParams);
      
      return {
        data: rows as CategoryInfo[],
        total: countRows[0].total as number,
      };
    },
    ['ManageCategoriesModel-getCategoriesPaginated'],
    { tags: ['categories'] }
  );

  /**
   * Add a new category
   */
  static async addCategory(name: string): Promise<{ success?: boolean; isDuplicateDeleted?: boolean; name?: string }> {
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT category_id FROM category_data WHERE category_name = ? AND remove = 0',
      [name]
    );
    if (existing.length > 0) {
      throw new Error("มีหมวดหมู่ชื่อนี้อยู่ในระบบแล้ว");
    }

    const [removed] = await db.query<RowDataPacket[]>(
      'SELECT category_name FROM category_data WHERE category_name = ? AND remove = 1 LIMIT 1',
      [name]
    );
    if (removed.length > 0) {
      return { isDuplicateDeleted: true, name: name };
    }

    await db.execute(
      'INSERT INTO category_data (category_name, remove) VALUES (?, 0)',
      [name]
    );
    return { success: true };
  }

  /**
   * Restore category
   */
  static async restoreCategory(name: string): Promise<void> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        'UPDATE category_data SET remove = 0 WHERE category_name = ?',
        [name]
      );
      
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT category_id FROM category_data WHERE category_name = ?',
        [name]
      );
      if (rows.length > 0) {
        const ids = rows.map(r => r.category_id);
        const placeholders = ids.map(() => '?').join(',');
        await connection.execute(
          `UPDATE photo_in_category SET remove = 0 WHERE category_id IN (${placeholders})`,
          ids
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get selected photos for a category
   */
  static async getCategoryImages(name: string): Promise<number[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT pic.photo_id 
       FROM photo_in_category pic
       JOIN category_data cd ON pic.category_id = cd.category_id
       JOIN photo_data pd ON pic.photo_id = pd.photo_id
       WHERE cd.category_name = ? AND cd.remove = 0 AND pic.remove = 0 AND pd.remove = 0`,
      [name]
    );
    return rows.map(r => r.photo_id as number);
  }

  /**
   * Get image count for a category
   */
  static async getCategoryImageCount(categoryId: number): Promise<number> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(pic.photo_id) as count 
       FROM photo_in_category pic
       JOIN category_data cd ON pic.category_id = cd.category_id
       JOIN photo_data pd ON pic.photo_id = pd.photo_id
       WHERE cd.category_id = ? AND cd.remove = 0 AND pic.remove = 0 AND pd.remove = 0`,
      [categoryId]
    );
    return rows[0].count as number;
  }

  /**
   * Update selected photos for a category
   */
  static async updateCategoryImages(name: string, newPhotoIds: number[]): Promise<void> {
    const [existingRows] = await db.query<RowDataPacket[]>(
      'SELECT category_id FROM category_data WHERE category_name = ? AND remove = 0',
      [name]
    );

    if (existingRows.length === 0) {
      throw new Error("ไม่พบหมวดหมู่นี้");
    }

    const categoryId = existingRows[0].category_id;
    
    // Delete existing photos for this category in photo_in_category
    await db.execute('DELETE FROM photo_in_category WHERE category_id = ?', [categoryId]);
    
    // Insert new photos
    for (const photoId of newPhotoIds) {
      await db.execute(
        'INSERT INTO photo_in_category (category_id, photo_id, remove) VALUES (?, ?, 0)',
        [categoryId, photoId]
      );
    }
  }

  /**
   * Update category name
   */
  static async updateCategoryName(oldName: string, newName: string): Promise<void> {
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT category_id FROM category_data WHERE category_name = ? AND remove = 0',
      [newName]
    );
    if (existing.length > 0 && oldName !== newName) {
      throw new Error("มีหมวดหมู่ชื่อนี้อยู่ในระบบแล้ว");
    }

    await db.execute(
      'UPDATE category_data SET category_name = ? WHERE category_name = ?',
      [newName, oldName]
    );
  }

  /**
   * Delete category (Soft delete)
   */
  static async deleteCategory(name: string): Promise<void> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        'UPDATE category_data SET remove = 1 WHERE category_name = ?',
        [name]
      );
      
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT category_id FROM category_data WHERE category_name = ?',
        [name]
      );
      if (rows.length > 0) {
        const ids = rows.map(r => r.category_id);
        const placeholders = ids.map(() => '?').join(',');
        await connection.execute(
          `UPDATE photo_in_category SET remove = 1 WHERE category_id IN (${placeholders})`,
          ids
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
