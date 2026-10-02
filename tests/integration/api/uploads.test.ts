import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/uploads/[filename]/route';

const mockGetFile = vi.fn();
const mockGetCachedFile = vi.fn();
const mockSaveCachedFile = vi.fn();
const mockProcessAudio = vi.fn();

vi.mock('@/services/storage/LocalStorageService', () => {
  return {
    LocalStorageService: class {
      getFile = mockGetFile;
      getCachedFile = mockGetCachedFile;
      saveCachedFile = mockSaveCachedFile;
    },
  };
});

vi.mock('@/services/media/AudioProcessor', () => {
  return {
    AudioProcessor: class {
      processAudio = mockProcessAudio;
    },
  };
});

describe('API Route /api/uploads/[filename] (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ความปลอดภัยและการป้องกัน Directory Traversal', () => {
    it('ควรตอบกลับ status 400 เมื่อชื่อไฟล์มี .. (Directory Traversal)', async () => {
      const req = new NextRequest('http://localhost:3000/api/uploads/../secret.txt');
      const params = Promise.resolve({ filename: '../secret.txt' });

      const res = await GET(req, { params });
      expect(res.status).toBe(400);
      expect(await res.text()).toBe('Invalid filename');
    });

    it('ควรตอบกลับ status 400 เมื่อชื่อไฟล์มีเครื่องหมาย /', async () => {
      const req = new NextRequest('http://localhost:3000/api/uploads/sub/image.png');
      const params = Promise.resolve({ filename: 'sub/image.png' });

      const res = await GET(req, { params });
      expect(res.status).toBe(400);
      expect(await res.text()).toBe('Invalid filename');
    });
  });

  describe('การให้บริการไฟล์เสียงและการ Transcode', () => {
    it('กรณีมี bitrate และพบไฟล์ใน Cache: ควรส่งคืนไฟล์จาก Cache ทันที', async () => {
      const cachedBuffer = Buffer.from('cached-audio-content');
      mockGetCachedFile.mockResolvedValueOnce(cachedBuffer);

      const req = new NextRequest('http://localhost:3000/api/uploads/sound.mp3?bitrate=128');
      const params = Promise.resolve({ filename: 'sound.mp3' });

      const res = await GET(req, { params });
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
      expect(mockGetCachedFile).toHaveBeenCalledWith('sound.mp3', '128kbps.mp3');
      expect(mockProcessAudio).not.toHaveBeenCalled();
    });

    it('กรณีมี bitrate แต่ไม่พบใน Cache: ควรอ่านไฟล์ต้นฉบับ ทำการ Transcode และบันทึก Cache', async () => {
      mockGetCachedFile.mockResolvedValueOnce(null);
      const originalBuffer = Buffer.from('original-audio');
      const transcodedBuffer = Buffer.from('transcoded-audio');

      mockGetFile.mockResolvedValueOnce(originalBuffer);
      mockProcessAudio.mockResolvedValueOnce(transcodedBuffer);

      const req = new NextRequest('http://localhost:3000/api/uploads/sound.wav?bitrate=64');
      const params = Promise.resolve({ filename: 'sound.wav' });

      const res = await GET(req, { params });
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
      expect(mockGetFile).toHaveBeenCalledWith('sound.wav', true);
      expect(mockProcessAudio).toHaveBeenCalledWith(originalBuffer, 64);
      expect(mockSaveCachedFile).toHaveBeenCalledWith('sound.wav', '64kbps.mp3', transcodedBuffer);
    });

    it('กรณี Transcoding ล้มเหลว: ควร Fallback กลับไปอ่านและส่งคืนไฟล์ต้นฉบับ', async () => {
      mockGetCachedFile.mockResolvedValueOnce(null);
      const originalBuffer = Buffer.from('original-audio');
      mockGetFile.mockResolvedValue(originalBuffer);
      mockProcessAudio.mockRejectedValueOnce(new Error('FFmpeg failed'));

      const req = new NextRequest('http://localhost:3000/api/uploads/sound.mp3?bitrate=128');
      const params = Promise.resolve({ filename: 'sound.mp3' });

      const res = await GET(req, { params });
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    });
  });

  describe('การให้บริการไฟล์รูปภาพและไฟล์มีเดียทั่วไป', () => {
    it('ควรส่งคืนไฟล์ png พร้อม Content-Type image/png', async () => {
      const imageBuffer = Buffer.from('png-data');
      mockGetFile.mockResolvedValueOnce(imageBuffer);

      const req = new NextRequest('http://localhost:3000/api/uploads/photo.png');
      const params = Promise.resolve({ filename: 'photo.png' });

      const res = await GET(req, { params });
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('image/png');
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    });

    it('ควรตรวจจับ Content-Type อื่น ๆ ได้อย่างถูกต้อง (jpg, webp, svg, wav, ogg)', async () => {
      const buffer = Buffer.from('media-data');

      // Test JPG
      mockGetFile.mockResolvedValueOnce(buffer);
      let res = await GET(new NextRequest('http://localhost:3000/api/uploads/test.jpg'), {
        params: Promise.resolve({ filename: 'test.jpg' }),
      });
      expect(res.headers.get('Content-Type')).toBe('image/jpeg');

      // Test WEBP
      mockGetFile.mockResolvedValueOnce(buffer);
      res = await GET(new NextRequest('http://localhost:3000/api/uploads/test.webp'), {
        params: Promise.resolve({ filename: 'test.webp' }),
      });
      expect(res.headers.get('Content-Type')).toBe('image/webp');

      // Test SVG
      mockGetFile.mockResolvedValueOnce(buffer);
      res = await GET(new NextRequest('http://localhost:3000/api/uploads/test.svg'), {
        params: Promise.resolve({ filename: 'test.svg' }),
      });
      expect(res.headers.get('Content-Type')).toBe('image/svg+xml');

      // Test WAV
      mockGetFile.mockResolvedValueOnce(buffer);
      res = await GET(new NextRequest('http://localhost:3000/api/uploads/test.wav'), {
        params: Promise.resolve({ filename: 'test.wav' }),
      });
      expect(res.headers.get('Content-Type')).toBe('audio/wav');

      // Test OGG
      mockGetFile.mockResolvedValueOnce(buffer);
      res = await GET(new NextRequest('http://localhost:3000/api/uploads/test.ogg'), {
        params: Promise.resolve({ filename: 'test.ogg' }),
      });
      expect(res.headers.get('Content-Type')).toBe('audio/ogg');
    });

    it('ควรตอบกลับ status 404 เมื่อไม่พบไฟล์ในระบบ', async () => {
      mockGetFile.mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost:3000/api/uploads/missing.png');
      const params = Promise.resolve({ filename: 'missing.png' });

      const res = await GET(req, { params });
      expect(res.status).toBe(404);
      expect(await res.text()).toBe('File not found');
    });
  });
});
