import { describe, it, expect, vi } from 'vitest';
import { transcodeAudioBuffer } from '@/lib/ffmpeg';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

describe('transcodeAudioBuffer (Unit Tests)', () => {
  it('ควร transcode เสียงสำเร็จและคืนค่า Buffer เมื่อ FFmpeg exit code 0', async () => {
    const mockStdout = new EventEmitter();
    const mockStderr = new EventEmitter();
    const mockStdin = {
      on: vi.fn(),
      once: vi.fn(),
      emit: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    };

    const mockProcess = Object.assign(new EventEmitter(), {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: mockStdin
    });

    vi.mocked(spawn).mockImplementationOnce(() => {
      setTimeout(() => {
        mockStdout.emit('data', Buffer.from('transcoded-chunk'));
        mockProcess.emit('close', 0);
      }, 10);
      return mockProcess as unknown as ReturnType<typeof spawn>;
    });

    const result = await transcodeAudioBuffer(Buffer.from('input-audio'), 128);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe('transcoded-chunk');
  });

  it('ควรโยน Error เมื่อ FFmpeg exit ด้วย code ที่ไม่ใช่ 0', async () => {
    const mockStdout = new EventEmitter();
    const mockStderr = new EventEmitter();
    const mockStdin = {
      on: vi.fn(),
      once: vi.fn(),
      emit: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    };

    const mockProcess = Object.assign(new EventEmitter(), {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: mockStdin
    });

    vi.mocked(spawn).mockImplementationOnce(() => {
      setTimeout(() => {
        mockProcess.emit('close', 1);
      }, 10);
      return mockProcess as unknown as ReturnType<typeof spawn>;
    });

    await expect(transcodeAudioBuffer(Buffer.from('corrupt-audio'), 128))
      .rejects.toThrow('FFmpeg process exited with code 1');
  });

  it('ควรโยน Error เมื่อ spawn เกิด error event', async () => {
    const mockStdout = new EventEmitter();
    const mockStderr = new EventEmitter();
    const mockStdin = {
      on: vi.fn(),
      once: vi.fn(),
      emit: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    };

    const mockProcess = Object.assign(new EventEmitter(), {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: mockStdin
    });

    vi.mocked(spawn).mockImplementationOnce(() => {
      setTimeout(() => {
        mockProcess.emit('error', new Error('spawn ENOENT'));
      }, 10);
      return mockProcess as unknown as ReturnType<typeof spawn>;
    });

    await expect(transcodeAudioBuffer(Buffer.from('audio'), 128))
      .rejects.toThrow('Failed to start FFmpeg: spawn ENOENT');
  });
});
