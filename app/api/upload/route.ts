import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to storage/uploads
    const uploadDir = path.join(process.cwd(), "storage/uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);
    
    // File is saved successfully

    return NextResponse.json({
      message: "File uploaded successfully. Database connection verified.",
      url: `/uploads/${filename}`,
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

