import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validation
        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Don't reveal whether user exists for security
        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json(
                { message: 'If an account exists with this email, a password reset link has been sent' },
                { status: 200 }
            );
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Token expires in 1 hour
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        // Delete any existing reset tokens for this email
        await prisma.passwordResetToken.deleteMany({
            where: { email },
        });

        // Create new reset token
        await prisma.passwordResetToken.create({
            data: {
                email,
                token: hashedToken,
                expires,
            },
        });

        // In production, send email with reset link
        // For now, log to console
        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        console.log('='.repeat(80));
        console.log('PASSWORD RESET REQUEST');
        console.log('='.repeat(80));
        console.log(`Email: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log(`Expires: ${expires.toISOString()}`);
        console.log('='.repeat(80));

        return NextResponse.json(
            { message: 'If an account exists with this email, a password reset link has been sent' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
