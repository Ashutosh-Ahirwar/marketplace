import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensure it always fetches fresh data

export async function GET() {
  try {
    const apps = await prisma.miniApp.findMany({
      orderBy: { createdAt: 'desc' },
      include: { owner: true }
    });

    // Transform to UI format if needed, or send as is
    // Added (app: any) to bypass the implicit any error
    const formattedApps = apps.map((app: any) => ({
      ...app,
      category: app.category,
      createdAt: app.createdAt.getTime(), // Convert Date to timestamp for frontend math
      authorUsername: app.owner?.username || "Unknown"
    }));

    return NextResponse.json({ apps: formattedApps });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
  }
}