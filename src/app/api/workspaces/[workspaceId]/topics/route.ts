import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { workspaceId } = await params;

    try {
        const topics = await prisma.topic.findMany({
            where: {
                workspaceId: workspaceId,
                workspace: {
                    members: {
                        some: {
                            userId: userId
                        }
                    }
                }
            },
            include: {
                _count: {
                    select: { boards: true }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return NextResponse.json(topics);
    } catch (error) {
        console.error('[TOPICS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { workspaceId } = await params;

    try {
        const json = await request.json();
        const { name } = json;

        if (!name) {
            return new NextResponse('Name is required', { status: 400 });
        }

        const workspace = await prisma.workspace.findUnique({
            where: {
                id: workspaceId,
                members: {
                    some: {
                        userId: userId
                    }
                }
            }
        });

        if (!workspace) {
            return new NextResponse('Workspace not found or unauthorized', { status: 404 });
        }

        const topic = await prisma.topic.create({
            data: {
                name,
                workspaceId: workspaceId
            }
        });

        return NextResponse.json(topic);
    } catch (error) {
        console.error('[TOPICS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
