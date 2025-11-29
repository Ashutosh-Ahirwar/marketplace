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
    if (!auth || !auth.signature) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // Verify the user actually signed this request AND recover their address
    const userWalletAddress = await verifyUserAuth({ 
      fid: fid, 
      signature: auth.signature, 
      message: auth.message, 
      nonce: auth.nonce 
    });

    // 1. Verify Payment AND Sender (Anti-Hijacking)
    await verifyPayment(txHash, MARKETPLACE_CONFIG.prices.featuredUsdc, userWalletAddress as string);

    // 2. Check Availability (Robust Check)
    const existingSlot = await prisma.featuredSlot.findUnique({
      where: { slotIndex }
    });

    if (existingSlot && existingSlot.expiresAt > new Date()) {
      return NextResponse.json({ success: false, error: "Slot was taken just now." }, { status: 409 });
    }

    // 3. Verify App Ownership
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

    // 4. Calculate Expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 5. Upsert Slot & Record Transaction
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          txHash,
          userFid: fid,
          type: 'FEATURED',
          amount: MARKETPLACE_CONFIG.prices.featuredUsdc,
          status: 'SUCCESS',
          description: `Rented Slot #${slotIndex + 1} for ${appToFeature.name}`
        }
      }),
      prisma.featuredSlot.upsert({
        where: { slotIndex },
        update: { appId, expiresAt },
        create: { slotIndex, appId, expiresAt }
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Feature Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 400 });
  }
}