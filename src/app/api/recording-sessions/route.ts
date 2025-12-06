import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Since there is no RecordingSession model in the schema yet,
        // we return an empty list or mock data.
        // In a real implementation, this would fetch from prisma.recordingSession.findMany(...)

        const mockSessions = [
            // Uncomment to test UI
            /*
            {
                id: '1',
                title: 'Project Planning',
                createdAt: new Date().toISOString(),
                durationSec: 120,
                workspace: { id: 'ws1', name: 'Engineering' },
                board: { id: 'b1', title: 'Q4 Roadmap' }
            },
            {
                id: '2',
                title: 'Quick Sketch',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                durationSec: 45,
                workspace: { id: 'ws1', name: 'Engineering' },
                board: { id: 'b2', title: 'Architecture' }
            }
            */
        ];

        return NextResponse.json({ sessions: [] });
    } catch (error) {
        console.error('[RECORDING_SESSIONS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
