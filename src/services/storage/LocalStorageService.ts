import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { IStorageService } from "./IStorageService";

export class LocalStorageService implements IStorageService {
  private baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.join(process.cwd(), "uploads");
  }

  private getDir(isAudio: boolean): string {
    return path.join(this.baseUploadDir, isAudio ? 'audio' : 'images');
  }

  async uploadFile(buffer: Buffer, originalFilename: string, isAudio: boolean): Promise<string> {
    const uploadDir = this.getDir(isAudio);
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = originalFilename.split('.').pop()?.toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    
    let filename = "";

    if (isAudio) {
      filename = `${uniqueSuffix}${ext ? `.${ext}` : ''}`;
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);
    } else {
      filename = `${uniqueSuffix}.webp`;
      const filePath = path.join(uploadDir, filename);
      
      await sharp(buffer)
        .resize(1024, 1024, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(filePath);
    }

    return filename;
  }

  async getFile(filename: string, isAudio: boolean): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.getDir(isAudio), filename);
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  async deleteFile(filename: string, isAudio: boolean): Promise<boolean> {
    try {
      const filePath = path.join(this.getDir(isAudio), filename);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getCachedFile(filename: string, suffix: string): Promise<Buffer | null> {
    try {
      const cacheDir = path.join(this.baseUploadDir, "cache");
      const filePath = path.join(cacheDir, `${filename}_${suffix}`);
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  async saveCachedFile(filename: string, suffix: string, buffer: Buffer): Promise<void> {
    try {
      const cacheDir = path.join(this.baseUploadDir, "cache");
      await fs.mkdir(cacheDir, { recursive: true }).catch(() => {});
      const filePath = path.join(cacheDir, `${filename}_${suffix}`);
      await fs.writeFile(filePath, buffer);
    } catch (e) {
      console.error("Failed to save cache file:", e);
    }
  }
}
