import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                bio: true,
                phone: true,
                location: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, image, bio, phone, location } = body;

        // Validation
        if (name !== undefined && !name.trim()) {
            return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
        }

        // Validate image size if provided (max 5MB base64)
        if (image && image.length > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Image size too large. Maximum 5MB allowed.' },
                { status: 400 }
            );
        }

        // Validate bio length
        if (bio !== undefined && bio.length > 500) {
            return NextResponse.json(
                { error: 'Bio must be 500 characters or less' },
                { status: 400 }
            );
        }

        // Build update data object with only provided fields
        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (image !== undefined) updateData.image = image;
        if (bio !== undefined) updateData.bio = bio;
        if (phone !== undefined) updateData.phone = phone;
        if (location !== undefined) updateData.location = location;

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                id: true,
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
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
