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

    // 1. SCALABILITY FIX: Define a limit
    const HISTORY_LIMIT = 50;

    // Fetch Data in Parallel with Limits
    const [listings, transactions, logs] = await Promise.all([
      prisma.miniApp.findMany({
        where: { ownerFid: fidInt },
        orderBy: { createdAt: 'desc' },
        take: HISTORY_LIMIT // Added limit
      }),
      prisma.transaction.findMany({
        where: { userFid: fidInt },
        orderBy: { timestamp: 'desc' },
        take: HISTORY_LIMIT // Added limit
      }),
      prisma.activityLog.findMany({
        where: { userFid: fidInt },
        orderBy: { timestamp: 'desc' },
        take: HISTORY_LIMIT // Added limit
      })
    ]);

    // Normalize ActivityLogs to match Transaction shape for Frontend
    const formattedLogs = logs.map((log: any) => ({
      id: log.id,
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

    // Merge and Sort by Date
    // 2. SCALABILITY FIX: Slice the combined array to ensure fixed response size
    const combinedHistory = [...formattedTransactions, ...formattedLogs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, HISTORY_LIMIT);

    return NextResponse.json({ 
      listings: listings.map((l: any) => ({ ...l, createdAt: l.createdAt.getTime() })),
      transactions: combinedHistory
    });

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}