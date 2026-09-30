export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { ManageCategoriesModel } from '@/lib/models/manageCategories';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ name: string }> | { name: string } }
) {
  try {
    const resolvedParams = await params;
    const oldName = decodeURIComponent(resolvedParams.name);
    const body = await request.json();
    const action = body.action;

    if (action === 'restore') {
      await ManageCategoriesModel.restoreCategory(oldName);
      revalidateTag('categories', 'max');
      return NextResponse.json({ success: true });
    }

    const newName = body.name;

    if (!newName || newName.trim() === '') {
      return NextResponse.json({ success: false, error: 'กรุณากรอกชื่อหมวดหมู่' }, { status: 400 });
    }

    const result = await ManageCategoriesModel.updateCategoryName(oldName, newName.trim());
    
    if (result && result.isDuplicateDeleted) {
      return NextResponse.json({ 
        success: false, 
        isDuplicateDeleted: true,
        name: result.name
      });
    }

    revalidateTag('categories', 'max');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in PUT /api/admin/categories/[name]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ name: string }> | { name: string } }
) {
  try {
    const resolvedParams = await params;
    const name = decodeURIComponent(resolvedParams.name);
    
    await ManageCategoriesModel.deleteCategory(name);
    revalidateTag('categories', 'max');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in DELETE /api/admin/categories/[name]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
