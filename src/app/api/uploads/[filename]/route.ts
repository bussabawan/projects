import { NextRequest, NextResponse } from "next/server";
import { LocalStorageService } from "@/services/storage/LocalStorageService";
import { AudioProcessor } from "@/services/media/AudioProcessor";

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  
  // Prevent directory traversal
  if (filename.includes("..") || filename.includes("/")) {
    return new NextResponse("Invalid filename", { status: 400 });
  }

  // Determine content type and folder based on extension
  const ext = filename.split('.').pop()?.toLowerCase();
  const isAudio = ['mp3', 'wav', 'ogg'].includes(ext || '');
  
  const storageService = new LocalStorageService();
  const audioProcessor = new AudioProcessor();

  try {
    let buffer: Buffer | null = null;
    
    // Check for bitrate param
    const bitrateParam = req.nextUrl.searchParams.get("bitrate");
    let isTranscoded = false;
    
    if (isAudio && bitrateParam) {
      const bitrate = parseInt(bitrateParam, 10);
      if (!isNaN(bitrate) && bitrate > 0) {
        const cacheSuffix = `${bitrate}kbps.mp3`;
        
        // Try to read from disk cache first
        buffer = await storageService.getCachedFile(filename, cacheSuffix);
        
        if (buffer) {
          isTranscoded = true;
        } else {
          // Cache miss, read original file and transcode
          try {
            const originalBuffer = await storageService.getFile(filename, isAudio);
            if (!originalBuffer) throw new Error("Original file not found");
            
            buffer = await audioProcessor.processAudio(originalBuffer, bitrate);
            
            // Save to disk cache asynchronously
            storageService.saveCachedFile(filename, cacheSuffix, buffer);
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
      buffer = await storageService.getFile(filename, isAudio);
    }
    
    if (!buffer) {
      return new NextResponse("File not found", { status: 404 });
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
    
    return new NextResponse(buffer as unknown as BodyInit, {
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
