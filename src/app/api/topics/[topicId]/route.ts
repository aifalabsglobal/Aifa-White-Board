import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function PUT(
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
        const { name, workspaceId } = json;

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

        const updatedTopic = await prisma.topic.update({
            where: { id: topicId },
            data: {
                name: name || undefined,
                workspaceId: workspaceId || undefined
            }
        });

        return NextResponse.json(updatedTopic);
    } catch (error) {
        console.error('[TOPIC_UPDATE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(
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

        await prisma.topic.delete({
            where: { id: topicId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[TOPIC_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
