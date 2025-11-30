import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserAuth } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
    const { appId, fid, auth } = await req.json();

    if (!auth || !auth.token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }
    
    await verifyUserAuth({ token: auth.token, fid: fid });

    const app = await prisma.miniApp.findUnique({
      where: { id: appId }
    });

    if (!app || app.ownerFid !== fid) {
      return NextResponse.json({ error: "Unauthorized: You do not own this app" }, { status: 403 });
    }

    // Atomic Transaction: Delete App + Record Activity Log
    await prisma.$transaction(async (tx) => {
      await tx.miniApp.delete({ where: { id: appId } });

      // Create Activity Log Entry (Clean Architecture)
      await tx.activityLog.create({
        data: {
          userFid: fid,
          action: 'DELETE_LISTING',
          details: `Deleted listing: ${app.name}`
        }
      });
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Delete App Error", error);
    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
  }
}