import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserAuth } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
    const { slotIndex, fid, auth } = await req.json();

    // 0. Security Check
    if (!auth || !auth.token) {
      return NextResponse.json({ error: "Unauthorized: Missing authentication token" }, { status: 401 });
    }
    
    // Verify user identity using Quick Auth
    await verifyUserAuth({ 
      token: auth.token, 
      fid: fid 
    });

    // 1. Fetch the Slot to verify ownership
    const slot = await prisma.featuredSlot.findUnique({
      where: { slotIndex },
      include: { app: true }
    });

    if (!slot) {
      return NextResponse.json({ error: "Slot not found or already empty" }, { status: 404 });
    }

    // 2. Verify Ownership
    if (slot.app.ownerFid !== fid) {
      return NextResponse.json({ error: "Unauthorized: You do not own the app in this slot" }, { status: 403 });
    }

    // 3. Delete the Slot (Stop featuring)
    // We delete the record from FeaturedSlot, freeing it up.
    await prisma.featuredSlot.delete({
      where: { slotIndex }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Delete Feature Error", error);
    return NextResponse.json({ error: error.message || "Failed to remove feature" }, { status: 500 });
  }
}