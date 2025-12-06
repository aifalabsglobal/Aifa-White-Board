import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ boardId: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { boardId } = await params;

    try {
        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: { workspace: { include: { members: true } } }
        });

        if (!board) {
            return new NextResponse('Board not found', { status: 404 });
        }

        const isOwner = board.userId === userId;
        const isMember = board.workspace?.members.some((m: { userId: string }) => m.userId === userId) ?? false;

        if (!isOwner && !isMember) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const labels = await prisma.label.findMany({
            where: { boardId: boardId },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(labels);
    } catch (error) {
        console.error('[LABELS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ boardId: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { boardId } = await params;

    try {
        const json = await request.json();
        const { name, color } = json;

        if (!name || !color) {
            return new NextResponse('Name and color are required', { status: 400 });
        }

        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: { workspace: { include: { members: true } } }
        });

        if (!board) {
            return new NextResponse('Board not found', { status: 404 });
        }

        const isOwner = board.userId === userId;
        const isMember = board.workspace?.members.some((m: { userId: string }) => m.userId === userId) ?? false;

        if (!isOwner && !isMember) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const label = await prisma.label.create({
            data: {
                name,
                color,
                boardId: boardId
            }
        });

        return NextResponse.json(label);
    } catch (error) {
        console.error('[LABELS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
