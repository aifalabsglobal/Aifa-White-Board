import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Find user's workspaces and their boards
  const workspace = await (prisma as any).workspace.findFirst({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      boards: {
        orderBy: {
          updatedAt: 'desc',
        },
        take: 1,
      },
    },
  });

  if (workspace && workspace.boards.length > 0) {
    redirect(`/board/${workspace.boards[0].id}`);
  }

  // If no board found, create a default one in the first workspace
  if (workspace) {
    const board = await (prisma as any).board.create({
      data: {
        title: 'Untitled Board',
        workspaceId: workspace.id,
        userId: session.user.id,
        content: [],
      },
    });
    redirect(`/board/${board.id}`);
  }

  // If no workspace (shouldn't happen due to auto-creation on register), redirect to login or error
  redirect('/login');
}
