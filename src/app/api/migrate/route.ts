import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>("SELECT photo_id, photo_name, audio_name FROM photo_data");
    let updatedCount = 0;

    for (const row of rows) {
      let changed = false;
      let photoName = row.photo_name;
      let audioName = row.audio_name;

      if (photoName && photoName.startsWith('/api/uploads/')) {
        photoName = photoName.replace('/api/uploads/', '');
        changed = true;
      }

      if (audioName && audioName.startsWith('/api/uploads/')) {
        audioName = audioName.replace('/api/uploads/', '');
        changed = true;
      }

      if (changed) {
        await db.execute(
          "UPDATE photo_data SET photo_name = ?, audio_name = ? WHERE photo_id = ?",
          [photoName, audioName, row.photo_id]
        );
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updatedCount, message: `Migrated ${updatedCount} rows.` });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
