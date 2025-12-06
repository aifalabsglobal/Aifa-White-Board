import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId } = await params;

        // Verify user is a member
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: userId,
                },
            },
        });

        if (!membership) {
            return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
        }

        // Check if user is owner
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { ownerId: true },
        });

        if (workspace?.ownerId === userId) {
            return NextResponse.json(
                { error: 'Workspace owner cannot leave. Transfer ownership or delete the workspace instead.' },
                { status: 400 }
            );
        }

        // Remove user from workspace
        await prisma.workspaceMember.delete({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: userId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error leaving workspace:', error);
        return NextResponse.json(
            { error: 'Failed to leave workspace' },
            { status: 500 }
        );
    }
}
