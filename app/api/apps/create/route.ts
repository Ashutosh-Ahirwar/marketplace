import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPayment } from '@/lib/server/verify';
import { verifyUserAuth } from '@/lib/server/auth'; // Import the new helper
import { MARKETPLACE_CONFIG } from '@/lib/config';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { txHash, appData, user, auth } = body; // Expect 'auth' object

    // 0. Security Check
    if (!auth || !auth.signature) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    // Verify the user actually signed this request
    await verifyUserAuth({ 
      fid: user.fid, 
      signature: auth.signature, 
      message: auth.message, 
      nonce: auth.nonce 
    });

    // 1. Verify Payment via Alchemy
    await verifyPayment(txHash, MARKETPLACE_CONFIG.prices.listingUsdc);

    // 2. Check if Tx Hash already used
    const existingTx = await prisma.transaction.findUnique({ where: { txHash } });
    if (existingTx) {
      return NextResponse.json({ success: false, error: "Transaction already used" }, { status: 400 });
    }

    // 3. Check if URL already listed
    const existingApp = await prisma.miniApp.findUnique({ where: { url: appData.url } });
    if (existingApp) {
      return NextResponse.json({ success: false, error: "App URL already listed" }, { status: 400 });
    }

    // 4. Atomic Database Transaction
    await prisma.$transaction(async (tx) => {
      // Ensure User
      await tx.user.upsert({
        where: { fid: user.fid },
        update: { username: user.username },
        create: { fid: user.fid, username: user.username }
      });

      // Create App
      await tx.miniApp.create({
        data: {
          name: appData.name,
          description: appData.description,
          url: appData.url,
          iconUrl: appData.iconUrl,
          category: appData.category,
          ownerFid: user.fid,
          isVerified: appData.isVerified || false
        }
      });

      // Record Transaction
      await tx.transaction.create({
        data: {
          txHash,
          userFid: user.fid,
          type: 'LISTING',
          amount: MARKETPLACE_CONFIG.prices.listingUsdc,
          status: 'SUCCESS',
          description: `Listed: ${appData.name}`
        }
      });
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Listing Logic Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
}