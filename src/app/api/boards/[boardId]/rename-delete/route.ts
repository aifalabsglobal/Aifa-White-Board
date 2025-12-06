import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { boardId } = await params;
        const body = await request.json();
        const { title } = body;

        if (!title?.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Check if user has access to this board
        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: {
                workspace: {
                    include: {
                        members: {
                            where: { userId: userId },
                        },
                    },
                },
            },
        });

        if (!board) {
            return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        }

        const isMember = board.workspace?.members && board.workspace.members.length > 0;
        const isOwner = board.userId === userId;

        if (!isMember && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updated = await prisma.board.update({
            where: { id: boardId },
            data: { title: title.trim() },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error renaming board:', error);
        return NextResponse.json({ error: 'Failed to rename board' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { boardId } = await params;

        // Check if user has access to delete this board
        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: {
                workspace: {
                    include: {
                        members: {
                            where: { userId: userId },
                        },
                    },
                },
            },
        });

        if (!board) {
            return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        }

        const userRole = board.workspace?.members[0]?.role;
        const isOwner = board.userId === userId;

        // Allow deletion if user is board owner, workspace owner, or workspace admin
        if (!isOwner && userRole !== 'OWNER' && userRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Delete board (cascades to pages)
        await prisma.board.delete({
            where: { id: boardId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting board:', error);
        return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
    }
}
