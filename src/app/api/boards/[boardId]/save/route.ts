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
        const body = await request.json();
        const { content } = body;

        // Verify board ownership/access
        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: { workspace: { include: { members: true } } },
        });

        if (!board) {
            return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        }

        // Check if user is member of workspace or owner of board
        const isMember = board.workspace?.members.some(
            (m) => m.userId === session.user?.id
        );
        const isOwner = board.userId === session.user?.id;

        if (!isMember && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update board content
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
