import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserAuth } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
    const { slotIndex, fid, auth } = await req.json();

    if (!auth || !auth.token) {
      return NextResponse.json({ error: "Unauthorized: Missing authentication token" }, { status: 401 });
    }
    
    await verifyUserAuth({ token: auth.token, fid: fid });

    const slot = await prisma.featuredSlot.findUnique({
      where: { slotIndex },
      include: { app: true }
    });

    if (!slot) {
      return NextResponse.json({ error: "Slot not found or already empty" }, { status: 404 });
    }

    if (slot.app.ownerFid !== fid) {
      return NextResponse.json({ error: "Unauthorized: You do not own the app in this slot" }, { status: 403 });
    }

    // Atomic Transaction: Remove Slot + Record History
    await prisma.$transaction(async (tx) => {
      await tx.featuredSlot.delete({ where: { slotIndex } });

      // Create History Record
      const uniqueSuffix = Math.random().toString(36).substring(7);
      await tx.transaction.create({
        data: {
          txHash: `DEL-FEAT-${Date.now()}-${uniqueSuffix}`, 
          userFid: fid,
          type: 'DELETE_FEATURED',
          amount: '0',
          status: 'SUCCESS',
          description: `Ended Promotion: ${slot.app.name}`
        }
      });
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Delete Feature Error", error);
    return NextResponse.json({ error: error.message || "Failed to remove feature" }, { status: 500 });
  }
}