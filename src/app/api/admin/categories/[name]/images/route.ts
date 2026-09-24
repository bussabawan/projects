export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { ManageCategoriesModel } from "@/lib/models/manageCategories";

export async function GET(_: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    
    const photoIds = await ManageCategoriesModel.getCategoryImages(decodedName);
    
    return NextResponse.json({ success: true, data: photoIds });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("GET category images error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const data = await req.json();
    const { photoIds } = data;

    if (!Array.isArray(photoIds)) {
      return NextResponse.json({ success: false, error: "photoIds must be an array" }, { status: 400 });
    }

    await ManageCategoriesModel.updateCategoryImages(decodedName, photoIds);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("PUT category images error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
