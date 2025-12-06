import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workspaces = await prisma.workspace.findMany({
            where: {
                members: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
                members: {
                    where: {
                        userId: userId,
                    },
                    select: {
                        role: true,
                    },
                },
                _count: {
                    select: {
                        boards: true,
                        members: true,
                    },
                },
                boards: {
                    select: {
                        id: true,
                        title: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        updatedAt: 'desc',
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        // Transform to include user's role directly
        const workspacesWithRole = workspaces.map((workspace: any) => ({
            ...workspace,
            userRole: workspace.members[0]?.role || 'VIEWER',
            members: undefined, // Remove the members array from response
        }));

        return NextResponse.json(workspacesWithRole);
    } catch (error) {
        console.error('Error loading workspaces:', error);
        return NextResponse.json(
            { error: 'Failed to load workspaces' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    console.log('[API] POST /api/workspaces called');
    try {
        const { userId } = await auth();
        console.log('[API] Auth check. UserId:', userId);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('[API] Request body:', body);
        const { name, workspaceId } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        // If workspaceId is provided, create a BOARD
        if (workspaceId) {
            // Verify membership
            const membership = await (prisma as any).workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId,
                        userId: userId,
                    },
                },
            });

            if (!membership) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const board = await (prisma as any).board.create({
                data: {
                    title: name,
                    workspaceId,
                    userId: userId,
                    content: [],
                },
            });

            // Create exactly ONE default page for the new board
            await (prisma as any).page.create({
                data: {
                    boardId: board.id,
                    title: 'Page 1',
                    order: 0,
                    content: { strokes: [] },
                },
            });

            return NextResponse.json({ board });
        }

        // If NO workspaceId, create a NEW WORKSPACE
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

        const workspace = await (prisma as any).workspace.create({
            data: {
                name,
                slug,
                ownerId: userId,
                members: {
                    create: {
                        userId: userId,
                        role: 'OWNER',
                    },
                },
            },
        });

        // Create a default board for the new workspace
        await (prisma as any).board.create({
            data: {
                title: 'Welcome Board',
                workspaceId: workspace.id,
                userId: userId,
                content: [],
            },
        });

        return NextResponse.json({ workspace });

    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
