import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function Home() {
  const session = await auth();
  
  if (session && session.user) {
    const role = (session.user as any).role;
    if (role === 1) {
      redirect('/user/games');
    } else {
      redirect('/admin');
    }
  }

  // Redirect to login page as the default route if not logged in
  redirect('/login');
}
