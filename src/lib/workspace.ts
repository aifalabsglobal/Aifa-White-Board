import { prisma } from './prisma';

/**
 * Creates a default workspace and welcome board for a new user
 * @param userId - The user's ID
 * @param email - The user's email (optional, used for workspace naming)
 * @returns The created workspace with its default board
 */
export async function createDefaultWorkspace(userId: string, email?: string | null) {
    const workspaceName = email
        ? `${email.split('@')[0]}'s Workspace`
        : 'My Workspace';

    const workspace = await prisma.workspace.create({
        data: {
            name: workspaceName,
            slug: `workspace-${userId.slice(0, 8)}`,
            ownerId: userId,
            members: {
                create: {
                    userId: userId,
                    role: 'OWNER',
                },
            },
        },
    });

    const board = await prisma.board.create({
        data: {
            title: 'Welcome Board',
            userId: userId,
            workspaceId: workspace.id,
            content: {},
        },
    });

    return { workspace, board };
}
