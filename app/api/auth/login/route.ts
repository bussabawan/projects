import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/user';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = await UserModel.authenticate(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Login successful
    // NOTE: In a real application, you should create a session or JWT token here
    // and set it in a cookie. For now, we just return the user data.
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.user_id,
        username: user.user_name,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
