import { NextRequest, NextResponse } from "next/server";
import { ManageImagesModel } from "@/lib/models/manageImages";

export async function DELETE(
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

    await ManageImagesModel.deleteImage(imageId);

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
    const { title, imageUrl, audioUrl, audioTitle, audioGen } = data;

    if (!title || !imageUrl) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    try {
      await ManageImagesModel.updateImage(imageId, { title, imageUrl, audioUrl, audioTitle, audioGen });
      return NextResponse.json({ success: true });
    } catch (modelError: unknown) {
      const mErr = modelError as Error;
      if (mErr.message === "มีชื่อรูปภาพนี้อยู่ในระบบแล้ว (Image title already exists)") {
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
