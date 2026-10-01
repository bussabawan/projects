import { transcodeAudioBuffer } from "@/lib/ffmpeg";

export class AudioProcessor {
  /**
   * Transcodes an audio buffer to MP3 format with a specific bitrate
   * @param buffer Original audio buffer
   * @param bitrate Target bitrate in kbps (default: 128)
   * @returns Transcoded audio buffer
   */
  async processAudio(buffer: Buffer, bitrate: number = 128): Promise<Buffer> {
    try {
      return await transcodeAudioBuffer(buffer, bitrate);
    } catch (error) {
      console.error("Audio processing failed:", error);
      throw new Error("Failed to process audio file.");
    }
  }
}
