import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPayment } from '@/lib/server/verify';
import { MARKETPLACE_CONFIG } from '@/lib/config';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { txHash, fid, username, appData } = body;

    // 1. Verify Payment on Blockchain
    await verifyPayment(txHash, MARKETPLACE_CONFIG.prices.listingUsdc);

    // 2. Ensure User Exists
    await prisma.user.upsert({
      where: { fid },
      update: { username },
      create: { fid, username }
    });

    // 3. Create Listing (Transaction + App)
    const result = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          txHash,
          userFid: fid,
          type: 'LISTING',
          amount: MARKETPLACE_CONFIG.prices.listingUsdc,
          status: 'SUCCESS',
          description: `Listed: ${appData.name}`
        }
      }),
      prisma.miniApp.create({
        data: {
          name: appData.name,
          description: appData.description,
          url: appData.url,
          iconUrl: appData.iconUrl,
          category: appData.category,
          ownerFid: fid,
          isVerified: appData.isVerified || false,
          // trendingScore and views default to 0
        }
      })
    ]);

    return NextResponse.json({ success: true, appId: result[1].id });

  } catch (error: any) {
    console.error("Listing Error:", error);
    // If it's a known logic error, return 400, else 500
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}