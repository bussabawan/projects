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
