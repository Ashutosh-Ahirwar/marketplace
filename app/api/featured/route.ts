import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPayment } from '@/lib/server/verify';
import { verifyUserAuth } from '@/lib/server/auth';
import { MARKETPLACE_CONFIG } from '@/lib/config';

// GET: Fetch current active slots
export async function GET() {
  const now = new Date();
  
  // Fetch slots and include App data
  const activeSlots = await prisma.featuredSlot.findMany({
    where: { expiresAt: { gt: now } }, // Only future expirations
    include: { app: { include: { owner: true } } },
    orderBy: { slotIndex: 'asc' }
  });

  // Map to a fixed array of 6 items (null if empty)
  const slots = Array(6).fill(null);
  activeSlots.forEach((slot: any) => {
    slots[slot.slotIndex] = slot.app;
  });

  return NextResponse.json({ slots });
}

// POST: Rent a slot
export async function POST(req: Request) {
  try {
    const { txHash, fid, slotIndex, appId, auth } = await req.json();

    // 0. Security Check
    // Expect 'token' from Quick Auth
    if (!auth || !auth.token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // Verify User Identity via Quick Auth
    await verifyUserAuth({ 
      token: auth.token,
      fid: fid
    });

    // 1. Verify Payment
    await verifyPayment(txHash, MARKETPLACE_CONFIG.prices.featuredUsdc);

    // 2. Verify App Ownership
    // Ensure the user trying to feature the app actually owns it
    const appToFeature = await prisma.miniApp.findUnique({
        where: { id: appId }
    });

    if (!appToFeature) {
        return NextResponse.json({ success: false, error: "App not found" }, { status: 404 });
    }

    if (appToFeature.ownerFid !== fid) {
        return NextResponse.json({ success: false, error: "You do not own this app" }, { status: 403 });
    }

    // 3. Atomic Reservation Logic
    // We use a transaction to ensure we don't overwrite an active slot.
    // Logic: Delete the slot IF it is expired, then try to CREATE. 
    // If it exists and is active, CREATE will fail (Unique Constraint on slotIndex).
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    await prisma.$transaction(async (tx) => {
      // Record Transaction first
      await tx.transaction.create({
        data: {
          txHash,
          userFid: fid,
          type: 'FEATURED',
          amount: MARKETPLACE_CONFIG.prices.featuredUsdc,
          status: 'SUCCESS',
          description: `Rented Slot #${slotIndex + 1} for ${appToFeature.name}`
        }
      });

      // Attempt to clear the slot if it's expired
      // If it is active (expiresAt > now), this does nothing.
      await tx.featuredSlot.deleteMany({
        where: { 
          slotIndex,
          expiresAt: { lt: now } 
        }
      });

      // Attempt to claim the slot. 
      // If the slot exists (was not expired/deleted), this throws P2002 (Unique Constraint violation)
      await tx.featuredSlot.create({
        data: { slotIndex, appId, expiresAt }
      });
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Feature Error:", error);
    
    // Check for Prisma Unique Constraint Violation (P2002)
    if (error.code === 'P2002') {
       return NextResponse.json({ success: false, error: "Slot was just taken by someone else." }, { status: 409 });
    }

    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 400 });
  }
}