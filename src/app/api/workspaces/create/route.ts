import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
        }

        // Create slug from name
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // Create workspace
        const workspace = await (prisma as any).workspace.create({
            data: {
                name: name.trim(),
                slug: `${slug}-${Date.now()}`,
                ownerId: session.user.id,
            },
        });

        // Add owner as member
        await (prisma as any).workspaceMember.create({
            data: {
                workspaceId: workspace.id,
                userId: session.user.id,
                role: 'OWNER',
            },
        });

        return NextResponse.json(workspace);
    } catch (error) {
        console.error('Error creating workspace:', error);
        return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
    }
}
