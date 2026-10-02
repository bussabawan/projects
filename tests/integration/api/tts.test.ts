import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tts/route';
import { promises as fs } from 'fs';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('API Route /api/tts (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ควรตอบกลับ status 400 เมื่อไม่มีพารามิเตอร์ text', async () => {
    const req = new NextRequest('http://localhost:3000/api/tts');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Text is required');
  });

  it('ควรส่งข้อมูลจากดิสก์แคชทันทีเมื่อพบไฟล์แคชอยู่แล้ว', async () => {
    const mockAudioBuffer = Buffer.from('mock-cached-audio');
    vi.mocked(fs.readFile).mockResolvedValueOnce(mockAudioBuffer);

    const req = new NextRequest('http://localhost:3000/api/tts?text=สวัสดี');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(res.headers.get('Cache-Control')).toContain('max-age=31536000');
  });

  it('ควร fetch จาก Google TTS และส่งกลับ audio/mpeg เมื่อ cache miss', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT')); // Cache miss

    const mockArrayBuffer = new Uint8Array([1, 2, 3, 4]).buffer;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockArrayBuffer)
    }));

    const req = new NextRequest('http://localhost:3000/api/tts?text=สุนัข');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://translate.google.com/translate_tts')
    );
  });

  it('ควรตอบกลับ status 500 เมื่อ Google TTS fetch ล้มเหลว', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT'));

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503
    }));

    const req = new NextRequest('http://localhost:3000/api/tts?text=ทดสอบ');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Failed to generate text-to-speech audio');
  });
});
