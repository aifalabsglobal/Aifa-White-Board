import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId } = await params;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                boards: {
                    orderBy: { updatedAt: 'desc' },
                },
                members: true,
            },
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        // Check if user is a member
        const isMember = workspace.members.some((m: { userId: string }) => m.userId === userId);
        if (!isMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(workspace);
    } catch (error) {
        console.error('Error loading workspace:', error);
        return NextResponse.json({ error: 'Failed to load workspace' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId } = await params;
        const body = await request.json();
        const { name } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Check if user is owner or admin
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                members: {
                    where: { userId: userId },
                },
            },
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        const userRole = workspace.members[0]?.role;
        if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Only owners and admins can rename workspaces' }, { status: 403 });
        }

        const updated = await prisma.workspace.update({
            where: { id: workspaceId },
            data: { name: name.trim() },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error renaming workspace:', error);
        return NextResponse.json({ error: 'Failed to rename workspace' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId } = await params;

        // Check if user is owner
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                members: {
                    where: { userId: userId },
                },
            },
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        if (workspace.ownerId !== userId) {
            return NextResponse.json({ error: 'Only workspace owners can delete workspaces' }, { status: 403 });
        }

        // Delete workspace (cascades to boards, pages, members)
        await prisma.workspace.delete({
            where: { id: workspaceId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting workspace:', error);
        return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
    }
}
