import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ labelId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { params } = context;
  const { labelId } = await params;

  try {
    const json = await request.json();
    const { name, color } = json;

    const label = await db.label.findUnique({
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

    const isOwner = label.board.userId === session.user.id;
    const isMember =
      label.board.workspace?.members.some(
        (m: { userId: string }) => m.userId === session.user.id
      ) ?? false;

    if (!isOwner && !isMember) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const updatedLabel = await db.label.update({
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
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { params } = context;
  const { labelId } = await params;

  try {
    const label = await db.label.findUnique({
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

    const isOwner = label.board.userId === session.user.id;
    const isMember =
      label.board.workspace?.members.some(
        (m: { userId: string }) => m.userId === session.user.id
      ) ?? false;

    if (!isOwner && !isMember) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await db.label.delete({
      where: { id: labelId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LABEL_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
