import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageImagesModel } from '@/lib/models/manageImages';
import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn(),
    getConnection: vi.fn()
  }
}));

describe('ManageImagesModel (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createImage', () => {
    it('ควรโยน Error เมื่อมีชื่อรูปภาพซ้ำในระบบ (remove = 0)', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ id: 1, remove: 0 }] as unknown as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      await expect(
        ManageImagesModel.createImage({
          title: 'สุนัข',
          imageUrl: 'dog.webp'
        })
      ).rejects.toThrow('มีชื่อรูปภาพนี้อยู่ในระบบแล้ว');
    });

    it('ควรคืนค่า isDuplicateDeleted เมื่อชื่อภาพเคยถูกลบไปแล้ว (remove = 1)', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ id: 45, remove: 1 }] as unknown as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const result = await ManageImagesModel.createImage({
        title: 'แมว',
        imageUrl: 'cat.webp'
      });

      expect(result).toEqual({ isDuplicateDeleted: true, duplicateId: 45 });
    });

    it('ควรบันทึกข้อมูลภาพลงใน photo_data สำเร็จและคืนค่า insertId', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]);
      vi.mocked(db.execute).mockResolvedValueOnce([
        { insertId: 88 } as ResultSetHeader,
        []
      ] as unknown as [ResultSetHeader, unknown]);

      const insertId = await ManageImagesModel.createImage({
        title: 'นกแก้ว',
        imageUrl: 'parrot.webp',
        audioUrl: 'parrot.mp3',
        audioTime: 1.8,
        audioTitle: 'นกแก้ว',
        audioGen: 1
      });

      expect(insertId).toBe(88);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO photo_data'),
        expect.arrayContaining(['parrot.webp', 'นกแก้ว', 'parrot.mp3', 1.8, 'นกแก้ว', 1])
      );
    });
  });

  describe('updateImage, deleteImage & getFileDataById', () => {
    it('updateImage ควรอัปเดตข้อมูลภาพใน photo_data', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]); // no duplicate
      vi.mocked(db.execute).mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []] as unknown as [ResultSetHeader, unknown]);

      await ManageImagesModel.updateImage(1, {
        title: 'สุนัขไทย',
        imageUrl: 'dog_th.webp'
      });

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE photo_data'),
        expect.arrayContaining(['สุนัขไทย', 1])
      );
    });

    it('deleteImage ควรอัปเดต remove = 1', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []] as unknown as [ResultSetHeader, unknown]);

      await ManageImagesModel.deleteImage(1);
      expect(db.execute).toHaveBeenCalledWith(
        'UPDATE photo_data SET remove = 1 WHERE photo_id = ?',
        [1]
      );
    });

    it('getFileDataById ควรคืนค่าชื่อไฟล์ภาพและเสียง', async () => {
      const mockFile = [{ photo_name: 'dog.webp', audio_name: 'dog.mp3' }] as unknown as RowDataPacket[];
      vi.mocked(db.query).mockResolvedValueOnce([mockFile, []] as unknown as [RowDataPacket[], unknown]);

      const result = await ManageImagesModel.getFileDataById(1);
      expect(result).toEqual({ photo_name: 'dog.webp', audio_name: 'dog.mp3' });
    });

    it('getFileDataById ควรคืนค่า null เมื่อไม่พบรูปภาพ', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([[], []] as unknown as [RowDataPacket[], unknown]);

      const result = await ManageImagesModel.getFileDataById(999);
      expect(result).toBeNull();
    });

    it('restoreImage ควรอัปเดต remove = 0', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader, []] as unknown as [ResultSetHeader, unknown]);

      await ManageImagesModel.restoreImage(5);
      expect(db.execute).toHaveBeenCalledWith(
        'UPDATE photo_data SET remove = 0 WHERE photo_id = ?',
        [5]
      );
    });
  });

  describe('getImages (Pagination)', () => {
    it('ควรดึงรูปภาพแบบแบ่งหน้าพร้อมค้นหาและเรียงลำดับตาม prioritizeIds', async () => {
      // 1. count query
      vi.mocked(db.query).mockResolvedValueOnce([[{ total: 15 }] as RowDataPacket[], []] as unknown as [RowDataPacket[], unknown]);
      // 2. data query
      const mockImages = [
        { id: 2, title: 'แมวส้ม', imageUrl: 'cat.jpg', audioUrl: 'cat.mp3' }
      ] as unknown as RowDataPacket[];
      vi.mocked(db.query).mockResolvedValueOnce([mockImages, []] as unknown as [RowDataPacket[], unknown]);

      const result = await ManageImagesModel.getImages(1, 10, 'แมว', [2]);
      expect(result.totalPages).toBe(2);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].imageUrl).toContain('/api/files/2?type=image');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY CASE WHEN photo_id IN (?) THEN 0 ELSE 1 END ASC'),
        expect.arrayContaining(['%แมว%', 2, 10, 0])
      );
    });
  });

  describe('updateImage Duplicate Cases', () => {
    it('updateImage ควรโยน Error เมื่อชื่อใหม่ไปซ้ำกับรูปภาพที่ยังใช้งานอยู่', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ id: 9, remove: 0 }] as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      await expect(
        ManageImagesModel.updateImage(1, { title: 'สุนัข' })
      ).rejects.toThrow('มีชื่อรูปภาพนี้อยู่ในระบบแล้ว');
    });

    it('updateImage ควรคืนค่า isDuplicateDeleted เมื่อชื่อใหม่ไปซ้ำกับรูปภาพที่ถูกลบ', async () => {
      vi.mocked(db.query).mockResolvedValueOnce([
        [{ id: 9, remove: 1 }] as RowDataPacket[],
        []
      ] as unknown as [RowDataPacket[], unknown]);

      const result = await ManageImagesModel.updateImage(1, { title: 'สุนัขเก่า' });
      expect(result).toEqual({ isDuplicateDeleted: true, duplicateId: 9 });
    });
  });
});
