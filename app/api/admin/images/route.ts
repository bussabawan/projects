import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT photo_id as id, photo_title as title, photo_name as imageUrl, audio_name as audioUrl, audio_title as audioTitle, audio_gen as audioGen
       FROM photo_data 
       WHERE remove = 0 
       ORDER BY photo_id DESC`
    );
    
    // Process URLs to be absolute if needed, or assume they are stored as /uploads/...
    // Based on the upload script, it saves as /uploads/filename
    return NextResponse.json({ success: true, data: rows });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("GET images error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { title, imageUrl, audioUrl, audioTitle, audioGen } = data;

    if (!title || !imageUrl) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Check if the title already exists (including deleted ones)
    const [existingRows]: any = await db.query(
      `SELECT photo_id as id, remove FROM photo_data WHERE photo_title = ?`,
      [title]
    );

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      if (existing.remove === 1) {
        // Return a special status indicating it was deleted and can be restored
        return NextResponse.json({ 
          success: false, 
          isDuplicateDeleted: true, 
          duplicateId: existing.id 
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: "มีชื่อรูปภาพนี้อยู่ในระบบแล้ว (Image title already exists)" 
        }, { status: 400 });
      }
    }

    // Insert into database
    const [result] = await db.query(
      `INSERT INTO photo_data (photo_name, photo_title, audio_name, audio_title, audio_gen, remove) 
       VALUES (?, ?, ?, ?, ?, 0)`,
      [
        imageUrl, 
        title, 
        audioUrl || "", 
        audioTitle || "", 
        audioGen ? 1 : 0
      ]
    );

    return NextResponse.json({ success: true, id: (result as ResultSetHeader).insertId });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("POST image error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
