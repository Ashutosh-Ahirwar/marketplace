import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserAuth } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
    const { appId, fid, auth } = await req.json();

    // 0. Security Check: Validate Quick Auth Token
    if (!auth || !auth.token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }
    
    // Verify user identity using Quick Auth
    await verifyUserAuth({ 
      token: auth.token,
      fid: fid
    });

    // 1. Verify Ownership
    const app = await prisma.miniApp.findUnique({
      where: { id: appId }
    });

    if (!app || app.ownerFid !== fid) {
      return NextResponse.json({ error: "Unauthorized: You do not own this app" }, { status: 403 });
    }

    // 2. Delete App & Record Transaction (Atomic)
    // We create a history entry even though there is no blockchain transaction
    await prisma.$transaction(async (tx) => {
      // Delete the App
      await tx.miniApp.delete({
        where: { id: appId }
      });

      // Create a History Record
      // We generate a unique ID for the txHash since one doesn't exist on-chain
      await tx.transaction.create({
        data: {
          txHash: `DEL-${Date.now()}-${appId}`, 
          userFid: fid,
          type: 'DELETE_LISTING',
          amount: '0',
          status: 'SUCCESS',
          description: `Deleted listing: ${app.name}`
        }
      });
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Delete Error", error);
    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
  }
}