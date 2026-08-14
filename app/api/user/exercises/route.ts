import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserModel } from '@/lib/models/user';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const exercises = await UserModel.getAssignedExercises(userId);

    return NextResponse.json({ success: true, data: exercises });
  } catch (error) {
    console.error('Error fetching assigned exercises:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
