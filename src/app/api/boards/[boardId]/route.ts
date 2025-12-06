import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { boardId } = await params;

        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: {
                workspace: { include: { members: true } },
                pages: { orderBy: { order: 'asc' } }
            },
        });

        if (!board) {
            return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        }

        // Check access
        const isMember = board.workspace?.members.some(
            (m: { userId: string }) => m.userId === userId
        ) ?? false;
        const isOwner = board.userId === userId;

        if (!isMember && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({
            id: board.id,
            title: board.title,
            content: board.content,
            workspaceId: board.workspaceId,
            workspace: board.workspace ? { id: board.workspace.id, name: board.workspace.name } : null,
            pages: board.pages,
        });
    } catch (error) {
        console.error('Error loading board:', error);
        return NextResponse.json(
            { error: `Failed to load board: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}
