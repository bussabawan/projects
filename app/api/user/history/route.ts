import { NextRequest, NextResponse } from 'next/server';
import { UserHistoryModel } from '@/lib/models/userHistory';
import { auth } from '@/auth'; // Assuming next-auth v5 is used and exported as auth in auth.ts or similar

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const history = await UserHistoryModel.getHistory(session.user.id, startDate, endDate);

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching user history:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
