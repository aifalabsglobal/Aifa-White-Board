import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ pageId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { pageId } = await params;

        const page = await prisma.page.findUnique({
            where: { id: pageId },
            include: { board: { include: { workspace: { include: { members: true } } } } },
        });

        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        // Check access
        const isMember = page.board.workspace?.members.some(
            (m: { userId: string }) => m.userId === userId
        ) ?? false;
        const isOwner = page.board.userId === userId;

        if (!isMember && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(page);
    } catch (error) {
        console.error('Error loading page:', error);
        return NextResponse.json(
            { error: 'Failed to load page' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ pageId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { pageId } = await params;
        const body = await request.json();

        const page = await prisma.page.findUnique({
            where: { id: pageId },
            include: { board: { include: { workspace: { include: { members: true } } } } },
        });

        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        // Check access
        const isMember = page.board.workspace?.members.some(
            (m: { userId: string }) => m.userId === userId
        ) ?? false;
        const isOwner = page.board.userId === userId;

        if (!isMember && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Build content with thumbnail if provided
        const contentToSave = {
            ...body.content,
            thumbnail: body.thumbnail || body.content?.thumbnail,
        };

        const updatedPage = await prisma.page.update({
            where: { id: pageId },
            data: {
                content: contentToSave,
                title: body.title, // Allow updating title if provided
            },
        });

        return NextResponse.json(updatedPage);
    } catch (error) {
        console.error('Error updating page:', error);
        return NextResponse.json(
            { error: 'Failed to update page' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ pageId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { pageId } = await params;

        const page = await prisma.page.findUnique({
            where: { id: pageId },
            include: { board: { include: { workspace: { include: { members: true } } } } },
        });

        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        // Check access
        const isMember = page.board.workspace?.members.some(
            (m: { userId: string }) => m.userId === userId
        ) ?? false;
        const isOwner = page.board.userId === userId;

        if (!isMember && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Prevent deleting the last page? Or maybe just allow it and handle empty state?
        // For now, let's allow it.

        await prisma.page.delete({
            where: { id: pageId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting page:', error);
        return NextResponse.json(
            { error: 'Failed to delete page' },
            { status: 500 }
        );
    }
}
