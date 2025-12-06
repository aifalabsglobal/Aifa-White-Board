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
            include: { workspace: { include: { members: true } } },
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

        const pages = await prisma.page.findMany({
            where: { boardId },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json(pages);
    } catch (error) {
        console.error('Error loading pages:', error);
        return NextResponse.json(
            { error: 'Failed to load pages' },
            { status: 500 }
        );
    }
}

export async function POST(
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
            include: { workspace: { include: { members: true } } },
        });

        if (!board) {
            return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        }

        // Check access (only members can create pages)
        const isMember = board.workspace?.members.some(
            (m: { userId: string }) => m.userId === userId
        ) ?? false;
        const isOwner = board.userId === userId;

        if (!isMember && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get max order
        const lastPage = await prisma.page.findFirst({
            where: { boardId },
            orderBy: { order: 'desc' },
        });

        const newOrder = (lastPage?.order ?? -1) + 1;
        const pageCount = await prisma.page.count({ where: { boardId } });

        const page = await prisma.page.create({
            data: {
                boardId,
                title: `Page ${pageCount + 1}`,
                order: newOrder,
                content: { strokes: [] }, // Initialize with empty content
            },
        });

        return NextResponse.json(page);
    } catch (error) {
        console.error('Error creating page:', error);
        return NextResponse.json(
            { error: 'Failed to create page' },
            { status: 500 }
        );
    }
}
