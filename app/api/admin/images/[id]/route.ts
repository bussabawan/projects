import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }

    // Soft delete
    await db.execute(
      `UPDATE photo_data SET remove = 1 WHERE photo_id = ?`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("DELETE image error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }

    const data = await req.json();
    const { title, imageUrl, audioUrl, audioTitle, audioGen } = data;

    if (!title || !imageUrl) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Check if title is duplicated by another image
    const [existingRows]: any = await db.query(
      `SELECT photo_id as id FROM photo_data WHERE photo_title = ? AND photo_id != ?`,
      [title, id]
    );

    if (existingRows.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: "มีชื่อรูปภาพนี้อยู่ในระบบแล้ว (Image title already exists)" 
      }, { status: 400 });
    }

    await db.execute(
      `UPDATE photo_data 
       SET photo_name = ?, photo_title = ?, audio_name = ?, audio_title = ?, audio_gen = ?, remove = 0 
       WHERE photo_id = ?`,
      [
        imageUrl, 
        title, 
        audioUrl || "", 
        audioTitle || "", 
        audioGen ? 1 : 0,
        id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("PUT image error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
