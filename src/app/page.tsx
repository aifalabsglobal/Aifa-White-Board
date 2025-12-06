import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Redirect to workspaces page for workspace-centric navigation
  redirect('/workspaces');
}

