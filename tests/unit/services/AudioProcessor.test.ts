import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioProcessor } from '@/services/media/AudioProcessor';
import { transcodeAudioBuffer } from '@/lib/ffmpeg';

vi.mock('@/lib/ffmpeg', () => ({
  transcodeAudioBuffer: vi.fn()
}));

describe('AudioProcessor (Unit Tests)', () => {
  let processor: AudioProcessor;

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new AudioProcessor();
  });

  it('ควรประมวลผลไฟล์เสียงและคืนค่า Buffer สำเร็จ', async () => {
    const input = Buffer.from('raw-audio');
    const output = Buffer.from('mp3-audio');

    vi.mocked(transcodeAudioBuffer).mockResolvedValueOnce(output);

    const result = await processor.processAudio(input, 192);
    expect(result).toBe(output);
    expect(transcodeAudioBuffer).toHaveBeenCalledWith(input, 192);
  });

  it('ควรโยน Error "Failed to process audio file." เมื่อการประมวลผลล้มเหลว', async () => {
    vi.mocked(transcodeAudioBuffer).mockRejectedValueOnce(new Error('FFmpeg failed'));

    await expect(processor.processAudio(Buffer.from('corrupt'), 128))
      .rejects.toThrow('Failed to process audio file.');
  });
});
