import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/upload/route';
const mockUploadFile = vi.fn();

vi.mock('@/services/storage/LocalStorageService', () => {
  return {
    LocalStorageService: class {
      uploadFile = mockUploadFile;
    }
  };
});

describe('API Route /api/upload (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ควรตอบกลับ status 400 เมื่อไม่มีการส่งไฟล์', async () => {
    const formData = new FormData();
    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('No file uploaded.');
  });

  it('ควรอัปโหลดไฟล์รูปภาพสำเร็จและส่งกลับ url', async () => {
    mockUploadFile.mockResolvedValueOnce('uploaded_image.webp');

    const formData = new FormData();
    const mockFile = new File(['mock-image-data'], 'test.png', { type: 'image/png' });
    formData.append('file', mockFile);

    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe('uploaded_image.webp');
    expect(json.message).toContain('File uploaded successfully');
  });

  it('ควรตอบกลับ status 500 เมื่อเกิดข้อผิดพลาดในการอัปโหลด', async () => {
    mockUploadFile.mockRejectedValueOnce(new Error('Storage disk full'));

    const formData = new FormData();
    const mockFile = new File(['mock-data'], 'test.mp3', { type: 'audio/mpeg' });
    formData.append('file', mockFile);

    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('Error uploading file');
    expect(json.details).toBe('Storage disk full');
  });
});
