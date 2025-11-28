import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPayment } from '@/lib/server/verify';
import { MARKETPLACE_CONFIG } from '@/lib/config';

// GET: Fetch current active slots
export async function GET() {
  const now = new Date();
  
  // Fetch slots and include App data
  const activeSlots = await prisma.featuredSlot.findMany({
    where: { expiresAt: { gt: now } }, // Only future expirations
    include: { app: true },
    orderBy: { slotIndex: 'asc' }
  });

  // Map to a fixed array of 6 items (null if empty)
  const slots = Array(6).fill(null);
  activeSlots.forEach(slot => {
    slots[slot.slotIndex] = slot.app;
  });

  return NextResponse.json({ slots });
}

// POST: Rent a slot
export async function POST(req: Request) {
  try {
    const { txHash, fid, slotIndex, appId } = await req.json();

    // 1. Verify Payment
    await verifyPayment(txHash, MARKETPLACE_CONFIG.prices.featuredUsdc);

    // 2. Check Availability (Robust Check)
    const existingSlot = await prisma.featuredSlot.findUnique({
      where: { slotIndex }
    });

    if (existingSlot && existingSlot.expiresAt > new Date()) {
      return NextResponse.json({ success: false, error: "Slot was taken just now." }, { status: 409 });
    }

    // 3. Calculate Expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 4. Upsert Slot & Record Transaction
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          txHash,
          userFid: fid,
          type: 'FEATURED',
          amount: MARKETPLACE_CONFIG.prices.featuredUsdc,
          status: 'SUCCESS',
          description: `Rented Slot #${slotIndex + 1}`
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
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}