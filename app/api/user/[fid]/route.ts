import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fid: string }> } // Params are async in Next.js 15
) {
  try {
    const { fid } = await params;
    const fidInt = parseInt(fid);

    if (isNaN(fidInt)) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
    }

    const [listings, transactions] = await Promise.all([
      prisma.miniApp.findMany({
        where: { ownerFid: fidInt },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.findMany({
        where: { userFid: fidInt },
        orderBy: { timestamp: 'desc' }
      })
    ]);

    return NextResponse.json({ 
      // Added (l: any) and (t: any) to bypass implicit any errors
      listings: listings.map((l: any) => ({ ...l, createdAt: l.createdAt.getTime() })),
      transactions: transactions.map((t: any) => ({ ...t, timestamp: t.timestamp.getTime() }))
    });

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}