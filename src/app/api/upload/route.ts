import { NextRequest, NextResponse } from "next/server";
import { LocalStorageService } from "@/services/storage/LocalStorageService";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isAudio = ['mp3', 'wav', 'ogg'].includes(ext || '');
    
    const storageService = new LocalStorageService();
    const filename = await storageService.uploadFile(buffer, file.name, isAudio);
    
    // File is saved successfully

    return NextResponse.json({
      message: "File uploaded successfully. Database connection verified.",
      url: filename,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Error uploading file or connecting to database.", details: err.message },
      { status: 500 }
    );
  }
}

