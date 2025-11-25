import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { boardId } = await params;
        const { content } = await request.json();

        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: { workspace: { include: { members: true } } },
        });

        if (!board) {
            return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        }

        const isMember = board.workspace?.members.some(
            (m: { userId: string }) => m.userId === session.user?.id
        ) ?? false;
        const isOwner = board.userId === session.user?.id;

        if (!isMember && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.board.update({
            where: { id: boardId },
            data: { content },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving board:', error);
        return NextResponse.json(
            { error: 'Failed to save board' },
            { status: 500 }
        );
    }
}
