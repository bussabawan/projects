import { NextResponse } from 'next/server';
import { PatientStatsModel } from '@/lib/models/patientStats';

export async function GET() {
  try {
    const stats = await PatientStatsModel.getPatientStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient statistics' },
      { status: 500 }
    );
  }
}
