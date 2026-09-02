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
    let buffer = await fs.readFile(filePath);
    
    // Check for bitrate param
    const bitrateParam = req.nextUrl.searchParams.get("bitrate");
    if (isAudio && bitrateParam) {
      const bitrate = parseInt(bitrateParam, 10);
      if (!isNaN(bitrate) && bitrate > 0) {
        try {
          buffer = await transcodeAudioBuffer(buffer, bitrate);
        } catch (err) {
          console.error("Transcoding failed:", err);
          // Fallback to original buffer if transcoding fails
        }
      }
    }

    // Determine content type
    let contentType = "application/octet-stream";
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'gif') contentType = 'image/gif';
    else if (ext === 'svg') contentType = 'image/svg+xml';
    else if (ext === 'mp3') contentType = 'audio/mpeg';
    else if (ext === 'wav') contentType = 'audio/wav';
    else if (ext === 'ogg') contentType = 'audio/ogg';
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
