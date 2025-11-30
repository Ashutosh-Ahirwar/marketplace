import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fid: string }> } 
) {
  try {
    const { fid } = await params;
    const fidInt = parseInt(fid);

    if (isNaN(fidInt)) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
    }

    // Fetch Data in Parallel
    const [listings, transactions, logs] = await Promise.all([
      prisma.miniApp.findMany({
        where: { ownerFid: fidInt },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.findMany({
        where: { userFid: fidInt },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.activityLog.findMany({
        where: { userFid: fidInt },
        orderBy: { timestamp: 'desc' }
      })
    ]);

    // Normalize ActivityLogs to match Transaction shape for Frontend
    const formattedLogs = logs.map((log: any) => ({
      id: log.id,
      // Create a unique ID for the UI key, but NOT a 0x hash so it isn't clickable
      txHash: `LOG-${log.id}`, 
      type: log.action,
      amount: "0",
      description: log.details,
      status: "SUCCESS",
      timestamp: log.timestamp.getTime()
    }));

    const formattedTransactions = transactions.map((t: any) => ({
      ...t,
      timestamp: t.timestamp.getTime()
    }));

    // Merge and Sort by Date (Newest First)
    const combinedHistory = [...formattedTransactions, ...formattedLogs].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    return NextResponse.json({ 
      listings: listings.map((l: any) => ({ ...l, createdAt: l.createdAt.getTime() })),
      transactions: combinedHistory
    });

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}