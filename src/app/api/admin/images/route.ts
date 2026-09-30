export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from 'next/cache';
import { ManageImagesModel } from "@/lib/models/manageImages";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "15");
    const search = url.searchParams.get("search") || "";
    const prioritizeIdsStr = url.searchParams.get("prioritizeIds") || "";
    const prioritizeIds = prioritizeIdsStr ? prioritizeIdsStr.split(',').map(Number).filter(n => !isNaN(n)) : [];

    const { data: images, totalPages } = await ManageImagesModel.getImages(page, limit, search, prioritizeIds);
    return NextResponse.json({ success: true, data: images, totalPages });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("GET images error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { title, imageUrl, audioUrl, audioTime, audioTitle, audioGen } = data;

    if (!title || !imageUrl) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    try {
      const result = await ManageImagesModel.createImage({ title, imageUrl, audioUrl, audioTime, audioTitle, audioGen });
      
      if (typeof result === 'object' && result.isDuplicateDeleted) {
        return NextResponse.json({ 
          success: false, 
          isDuplicateDeleted: true, 
          duplicateId: result.duplicateId 
        });
      }

      revalidateTag('images');
      return NextResponse.json({ success: true, id: result });
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
    console.error("POST image error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}


