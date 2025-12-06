import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
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
                ownerId: userId,
            },
        });

        // Add owner as member
        await (prisma as any).workspaceMember.create({
            data: {
                workspaceId: workspace.id,
                userId: userId,
                role: 'OWNER',
            },
        });

        return NextResponse.json(workspace);
    } catch (error) {
        console.error('Error creating workspace:', error);
        return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
    }
}
