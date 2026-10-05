import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/files/[id]/route';
import { ManageImagesModel } from '@/lib/models/manageImages';
import { promises as fs } from 'fs';

vi.mock('@/lib/models/manageImages', () => ({
  ManageImagesModel: {
    getFileDataById: vi.fn()
  }
}));

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn()
  }
}));

describe('API Route /api/files/[id] (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ควรตอบกลับ status 404 เมื่อไม่พบข้อมูลไฟล์ในฐานข้อมูล', async () => {
    vi.mocked(ManageImagesModel.getFileDataById).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/files/99');
    const params = Promise.resolve({ id: '99' });

    const res = await GET(req, { params });
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toBe('File not found in database');
  });

  it('ควรตอบกลับ status 400 เมื่อชื่อไฟล์มีความพยายามทำ Directory Traversal (..)', async () => {
    vi.mocked(ManageImagesModel.getFileDataById).mockResolvedValueOnce({
      photo_name: '../secret.txt',
      audio_name: ''
    });

    const req = new NextRequest('http://localhost:3000/api/files/1');
    const params = Promise.resolve({ id: '1' });

    const res = await GET(req, { params });
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid filename');
  });

  it('ควรสตรีมไฟล์รูปภาพ webp สำเร็จพร้อม Content-Type: image/webp', async () => {
    vi.mocked(ManageImagesModel.getFileDataById).mockResolvedValueOnce({
      photo_name: 'sample.webp',
      audio_name: ''
    });
    vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from('mock-webp-binary'));

    const req = new NextRequest('http://localhost:3000/api/files/5?type=image');
    const params = Promise.resolve({ id: '5' });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/webp');
  });

  it('ควรสตรีมไฟล์เสียง mp3 สำเร็จพร้อม Content-Type: audio/mpeg', async () => {
    vi.mocked(ManageImagesModel.getFileDataById).mockResolvedValueOnce({
      photo_name: '',
      audio_name: 'sound.mp3'
    });
    vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from('mock-mp3-binary'));

    const req = new NextRequest('http://localhost:3000/api/files/5?type=audio');
    const params = Promise.resolve({ id: '5' });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
  });

  it('ควรตอบกลับ status 404 เมื่อไม่พบไฟล์จริงบนดิสก์', async () => {
    vi.mocked(ManageImagesModel.getFileDataById).mockResolvedValueOnce({
      photo_name: 'missing.png',
      audio_name: ''
    });
    vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT'));

    const req = new NextRequest('http://localhost:3000/api/files/5');
    const params = Promise.resolve({ id: '5' });

    const res = await GET(req, { params });
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toBe('File not found on disk');
  });
});
