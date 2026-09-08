import { NextRequest, NextResponse } from "next/server";
import { ManageExercisesModel } from "@/lib/models/manageExercises";

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    
    const photoIds = await ManageExercisesModel.getExerciseImages(decodedName);
    const categoryIds = await ManageExercisesModel.getExerciseCategories(decodedName);
    
    return NextResponse.json({ success: true, data: photoIds, categories: categoryIds });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("GET exercise images error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const data = await req.json();
    const { photoIds, categoryIds } = data;

    if (!Array.isArray(photoIds)) {
      return NextResponse.json({ success: false, error: "photoIds must be an array" }, { status: 400 });
    }
    
    if (categoryIds && !Array.isArray(categoryIds)) {
      return NextResponse.json({ success: false, error: "categoryIds must be an array" }, { status: 400 });
    }

    await ManageExercisesModel.updateExerciseImages(decodedName, photoIds);
    if (categoryIds) {
      await ManageExercisesModel.updateExerciseCategories(decodedName, categoryIds);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("PUT exercise images error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
