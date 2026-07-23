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

    const responseData = await PatientDetailStatsModel.getPatientDetailStats(userId);
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('Error fetching patient statistics for chart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
