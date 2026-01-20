import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Since there is no RecordingSession model in the schema yet,
        // we return an empty list.
        // In a real implementation, this would fetch from prisma.recordingSession.findMany(...)

        return NextResponse.json({ sessions: [] });
    } catch (error) {
        console.error('[RECORDING_SESSIONS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
