import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { name, bio, phone, location } = body;

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name,
                bio,
                phone,
                location,
            },
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('[PROFILE_UPDATE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                name: true,
                email: true,
                image: true,
                bio: true,
                phone: true,
                location: true,
            },
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('[PROFILE_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
