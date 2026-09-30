export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from 'next/cache';
import { ManageImagesModel } from "@/lib/models/manageImages";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }

    const imageId = parseInt(id, 10);
    if (isNaN(imageId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    await ManageImagesModel.deleteImage(imageId);
    revalidateTag('images');
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

    const imageId = parseInt(id, 10);
    if (isNaN(imageId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const data = await req.json();
    const { title, imageUrl, audioUrl, audioTime, audioTitle, audioGen } = data;

    if (!title || !imageUrl) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    try {
      const result = await ManageImagesModel.updateImage(imageId, { title, imageUrl, audioUrl, audioTime, audioTitle, audioGen });
      
      if (typeof result === 'object' && result.isDuplicateDeleted) {
        return NextResponse.json({ 
          success: false, 
          isDuplicateDeleted: true,
          duplicateId: result.duplicateId,
          message: "มีชื่อรูปภาพนี้อยู่ในระบบแตะถูกลบไปแล้ว ต้องการกู้คืนหรือไม่"
        });
      }

      revalidateTag('images');
      return NextResponse.json({ success: true });
    } catch (modelError: unknown) {
      const mErr = modelError as Error;
      if (mErr.message === "มีชื่อรูปภาพนี้อยู่ในระบบแล้ว") {
        return NextResponse.json({ 
          success: false, 
          error: mErr.message 
        }, { status: 400 });
      }
      throw mErr;
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error("PUT image error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }

    const imageId = parseInt(id, 10);
    if (isNaN(imageId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const data = await req.json();
    
    if (data.action === 'restore') {
      await ManageImagesModel.restoreImage(imageId);
      revalidateTag('images');
      return NextResponse.json({ success: true, message: "Image restored successfully" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("PATCH image error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
