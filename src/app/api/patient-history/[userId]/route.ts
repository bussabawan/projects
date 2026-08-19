import { NextRequest, NextResponse } from 'next/server';
import { PatientHistoryModel } from '@/lib/models/patientHistory';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const responseData = await PatientHistoryModel.getHistory(userId, startDate, endDate, page, limit);
    return NextResponse.json(responseData);
    
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching patient history:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
