import { spawn } from 'child_process';
import { Readable } from 'stream';

export function transcodeAudioBuffer(inputBuffer: Buffer, bitrate: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',      // read from stdin
      '-b:a', `${bitrate}k`, // set bitrate
      '-f', 'mp3',         // output format
      'pipe:1'             // write to stdout
    ]);

    const chunks: Buffer[] = [];
    
    ffmpeg.stdout.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ffmpeg.stderr.on('data', (data) => {
      // You can uncomment for debugging ffmpeg issues
      // console.error(`ffmpeg stderr: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`Failed to start FFmpeg: ${err.message}`));
    });

    // Write input buffer to stdin
    const readable = new Readable();
    readable._read = () => {};
    readable.push(inputBuffer);
    readable.push(null);
    readable.pipe(ffmpeg.stdin);
  });
}
