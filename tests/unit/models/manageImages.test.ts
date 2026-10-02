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
  });
});
