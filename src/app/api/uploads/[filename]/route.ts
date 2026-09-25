import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { transcodeAudioBuffer } from "@/lib/ffmpeg";

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  
  // Prevent directory traversal
  if (filename.includes("..") || filename.includes("/")) {
    return new NextResponse("Invalid filename", { status: 400 });
  }

  // Determine content type and folder based on extension
  const ext = filename.split('.').pop()?.toLowerCase();
  const isAudio = ['mp3', 'wav', 'ogg'].includes(ext || '');
  const folder = isAudio ? 'audio' : 'images';

  const filePath = path.join(process.cwd(), "uploads", folder, filename);
  
  try {
    let buffer: Buffer | null = null;
    
    // Check for bitrate param
    const bitrateParam = req.nextUrl.searchParams.get("bitrate");
    let isTranscoded = false;
    
    if (isAudio && bitrateParam) {
      const bitrate = parseInt(bitrateParam, 10);
      if (!isNaN(bitrate) && bitrate > 0) {
        // Prepare cache directory
        const cacheDir = path.join(process.cwd(), "uploads", "cache");
        await fs.mkdir(cacheDir, { recursive: true }).catch(() => {});
        
        const cachedFilename = `${filename}_${bitrate}kbps.mp3`;
        const cachedFilePath = path.join(cacheDir, cachedFilename);
        
        try {
          // Try to read from disk cache first
          buffer = await fs.readFile(cachedFilePath);
          isTranscoded = true;
        } catch {
          // Cache miss, read original file and transcode
          try {
            const originalBuffer = await fs.readFile(filePath);
            buffer = await transcodeAudioBuffer(originalBuffer, bitrate);
            // Save to disk cache asynchronously (don't await to avoid blocking response)
            fs.writeFile(cachedFilePath, buffer).catch(err => {
              console.error("Failed to write cache file:", err);
            });
            isTranscoded = true;
          } catch (err) {
            console.error("Transcoding failed:", err);
            // Will fallback to reading original file below if transcoding fails entirely
          }
        }
      }
    }

    // Fallback if not transcoded (or if it's an image)
    if (!buffer) {
      buffer = await fs.readFile(filePath);
    }

    // Determine content type
    let contentType = "application/octet-stream";
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'gif') contentType = 'image/gif';
    else if (ext === 'svg') contentType = 'image/svg+xml';
    else if (ext === 'mp3' || isTranscoded) contentType = 'audio/mpeg';
    else if (ext === 'wav') contentType = 'audio/wav';
    else if (ext === 'ogg') contentType = 'audio/ogg';
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        // Aggressive caching: 1 year, immutable
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
