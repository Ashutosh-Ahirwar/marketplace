import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { appId, fid } = await req.json();

    // 1. Verify Ownership
    const app = await prisma.miniApp.findUnique({
      where: { id: appId }
    });

    if (!app || app.ownerFid !== fid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Delete
    await prisma.miniApp.delete({
      where: { id: appId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}