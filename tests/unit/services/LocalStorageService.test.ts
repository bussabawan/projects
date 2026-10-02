import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageService } from '@/services/storage/LocalStorageService';
import { promises as fs } from 'fs';
import sharp from 'sharp';

// Mock fs.promises
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from('test content')),
    unlink: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock sharp
vi.mock('sharp', () => {
  const sharpInstance = {
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue({ size: 100 })
  };
  return {
    default: vi.fn(() => sharpInstance)
  };
});

describe('LocalStorageService (Unit Tests)', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LocalStorageService();
  });

  describe('uploadFile', () => {
    it('ควรอัปโหลดและประมวลผลรูปภาพด้วย sharp ให้เป็น .webp', async () => {
      const buffer = Buffer.from('image buffer');
      const filename = await service.uploadFile(buffer, 'test.png', false);

      expect(filename).toMatch(/\.webp$/);
      expect(fs.mkdir).toHaveBeenCalled();
      expect(sharp).toHaveBeenCalledWith(buffer);
    });

    it('ควรอัปโหลดไฟล์เสียงและบันทึกนามสกุลเดิม', async () => {
      const buffer = Buffer.from('audio buffer');
      const filename = await service.uploadFile(buffer, 'sound.mp3', true);

      expect(filename).toMatch(/\.mp3$/);
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('getFile', () => {
    it('ควรดึงไฟล์และคืนค่า Buffer เมื่อไฟล์มีอยู่จริง', async () => {
      const result = await service.getFile('test.webp', false);
      expect(result).toBeInstanceOf(Buffer);
      expect(fs.readFile).toHaveBeenCalled();
    });

    it('ควรคืนค่า null เมื่ออ่านไฟล์ล้มเหลว', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'));
      const result = await service.getFile('not_exist.webp', false);
      expect(result).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('ควรลบไฟล์สำเร็จและคืนค่า true', async () => {
      const result = await service.deleteFile('test.webp', false);
      expect(result).toBe(true);
      expect(fs.unlink).toHaveBeenCalled();
    });

    it('ควรคืนค่า false เมื่อการลบไฟล์ล้มเหลว', async () => {
      vi.mocked(fs.unlink).mockRejectedValueOnce(new Error('Permission denied'));
      const result = await service.deleteFile('error.webp', false);
      expect(result).toBe(false);
    });
  });

  describe('Cache operations', () => {
    it('ควรบันทึกและอ่าน cached file ได้ถูกต้อง', async () => {
      const buffer = Buffer.from('cached data');
      await service.saveCachedFile('photo1', 'thumb', buffer);
      expect(fs.writeFile).toHaveBeenCalled();

      const result = await service.getCachedFile('photo1', 'thumb');
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
