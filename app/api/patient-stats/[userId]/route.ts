import { NextRequest, NextResponse } from 'next/server';
import { PatientDetailStatsModel } from '@/lib/models/patientDetailStats';

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
    const period = searchParams.get('period') || 'all';
    const category = searchParams.get('category') || 'all';
    const exerciseSet = searchParams.get('exerciseSet') || 'all';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const filters = { period, category, exerciseSet, startDate, endDate };
    const responseData = await PatientDetailStatsModel.getPatientDetailStats(userId, filters);
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('Error fetching patient statistics for chart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
