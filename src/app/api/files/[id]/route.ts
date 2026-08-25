import { NextRequest, NextResponse } from "next/server";
import { ManageImagesModel } from "@/lib/models/manageImages";
import { promises as fs } from "fs";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "image"; // 'image' or 'audio'

  try {
    const row = await ManageImagesModel.getFileDataById(Number(id));

    if (!row) {
      return new NextResponse("File not found in database", { status: 404 });
    }

    let filename = "";
    let folder = "";

    if (type === "audio") {
      filename = row.audio_name;
      folder = "audio";
    } else {
      filename = row.photo_name;
      folder = "images";
    }

    if (!filename) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Strip legacy /api/uploads/ prefix if it exists in the database
    if (filename.startsWith('/api/uploads/')) {
      filename = filename.replace('/api/uploads/', '');
    }

    // Prevent directory traversal
    if (filename.includes("..") || filename.includes("/")) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = path.join(process.cwd(), "uploads", folder, filename);
    
    const buffer = await fs.readFile(filePath);
    
    // Determine content type
    const ext = filename.split('.').pop()?.toLowerCase();
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
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("File not found on disk", { status: 404 });
  }
}
