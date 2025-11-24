import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ labelId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { labelId } = await params;

    try {
        const json = await request.json();
        const { name, color } = json;

        const label = await prisma.label.findUnique({
            where: { id: labelId },
            include: { board: { include: { workspace: { include: { members: true } } } } }
        });

        if (!label) {
            return new NextResponse('Label not found', { status: 404 });
        }

        const isOwner = label.board.userId === session.user.id;
        const isMember = label.board.workspace?.members.some((m: any) => m.userId === session.user.id);

        if (!isOwner && !isMember) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const updatedLabel = await prisma.label.update({
            where: { id: labelId },
            data: {
                name: name || undefined,
                color: color || undefined
            }
        });

        return NextResponse.json(updatedLabel);
    } catch (error) {
        console.error('[LABEL_UPDATE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ labelId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { labelId } = await params;

    try {
        const label = await prisma.label.findUnique({
            where: { id: labelId },
            include: { board: { include: { workspace: { include: { members: true } } } } }
        });

        if (!label) {
            return new NextResponse('Label not found', { status: 404 });
        }

        const isOwner = label.board.userId === session.user.id;
        const isMember = label.board.workspace?.members.some((m: any) => m.userId === session.user.id);

        if (!isOwner && !isMember) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await prisma.label.delete({
            where: { id: labelId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[LABEL_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
