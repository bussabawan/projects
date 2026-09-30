export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { ManageCategoriesModel } from '@/lib/models/manageCategories';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search') || '';

    if (page && limit) {
      const result = await ManageCategoriesModel.getCategoriesPaginated(Number(page), Number(limit), search);
      return NextResponse.json({
        success: true,
        data: result.data,
        total: result.total
      });
    }

    // Default behavior for other places (like dropdowns) that fetch all categories
    const categories = await ManageCategoriesModel.getCategories();
    
    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in GET /api/admin/categories:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'กรุณากรอกชื่อหมวดหมู่ (Category name is required)' }, { status: 400 });
    }

    const result = await ManageCategoriesModel.addCategory(name.trim());
    
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
    console.error('Error in POST /api/admin/categories:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
