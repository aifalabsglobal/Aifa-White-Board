import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ labelId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { params } = context;
  const { labelId } = await params;

  try {
    const json = await request.json();
    const { name, color } = json;

    const label = await prisma.label.findUnique({
      where: { id: labelId },
      include: {
        board: {
          include: {
            workspace: {
              include: { members: true }
            }
          }
        }
      }
    });

    if (!label) {
      return new NextResponse('Label not found', { status: 404 });
    }

    const isOwner = label.board.userId === userId;
    const isMember =
      label.board.workspace?.members.some(
        (m: { userId: string }) => m.userId === userId
      ) ?? false;

    if (!isOwner && !isMember) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const updatedLabel = await prisma.label.update({
      where: { id: labelId },
      data: {
        name: name || undefined,
        color: color || undefined
      }
    });

    return NextResponse.json(updatedLabel);
  } catch (error) {
    console.error('[LABEL_UPDATE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ labelId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { params } = context;
  const { labelId } = await params;

  try {
    const label = await prisma.label.findUnique({
      where: { id: labelId },
      include: {
        board: {
          include: {
            workspace: {
              include: { members: true }
            }
          }
        }
      }
    });

    if (!label) {
      return new NextResponse('Label not found', { status: 404 });
    }

    const isOwner = label.board.userId === userId;
    const isMember =
      label.board.workspace?.members.some(
        (m: { userId: string }) => m.userId === userId
      ) ?? false;

    if (!isOwner && !isMember) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.label.delete({
      where: { id: labelId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LABEL_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
