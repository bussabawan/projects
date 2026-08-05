import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  
  // Prevent directory traversal
  if (filename.includes("..") || filename.includes("/")) {
    return new NextResponse("Invalid filename", { status: 400 });
  }

  const filePath = path.join(process.cwd(), "storage/uploads", filename);
  
  try {
    const buffer = await fs.readFile(filePath);
    
    // Determine content type
    let contentType = "application/octet-stream";
    const ext = filename.split('.').pop()?.toLowerCase();
    
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
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
