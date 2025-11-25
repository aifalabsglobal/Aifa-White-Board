import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new NextResponse('No file uploaded', { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore error if directory exists
        }

        // Generate unique filename
        const filename = `${session.user.id}-${Date.now()}${path.extname(file.name)}`;
        const filepath = path.join(uploadDir, filename);

        // Write file to disk
        await writeFile(filepath, buffer);

        // Update user image URL
        const imageUrl = `/uploads/${filename}`;
        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { image: imageUrl },
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('[AVATAR_UPLOAD]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
