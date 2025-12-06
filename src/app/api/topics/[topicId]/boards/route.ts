import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ topicId: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { topicId } = await params;

    try {
        const topic = await prisma.topic.findUnique({
            where: { id: topicId },
            include: { workspace: { include: { members: true } } }
        });

        if (!topic) {
            return new NextResponse('Topic not found', { status: 404 });
        }

        const isMember = topic.workspace.members.some((m: { userId: string }) => m.userId === userId) ?? false;
        if (!isMember) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const boards = await prisma.board.findMany({
            where: { topicId: topicId },
            include: { labels: true },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(boards);
    } catch (error) {
        console.error('[TOPIC_BOARDS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ topicId: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { topicId } = await params;

    try {
        const json = await request.json();
        const { title } = json;

        if (!title) {
            return new NextResponse('Title is required', { status: 400 });
        }

        const topic = await prisma.topic.findUnique({
            where: { id: topicId },
            include: { workspace: { include: { members: true } } }
        });

        if (!topic) {
            return new NextResponse('Topic not found', { status: 404 });
        }

        const isMember = topic.workspace.members.some((m: { userId: string }) => m.userId === userId) ?? false;
        if (!isMember) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const board = await prisma.board.create({
            data: {
                title,
                userId: userId,
                workspaceId: topic.workspaceId,
                topicId: topicId,
                content: {}
            }
        });

        return NextResponse.json(board);
    } catch (error) {
        console.error('[TOPIC_BOARDS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
