import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppCategory } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('cat');
    
    // Pagination Params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20'); // Default 20 items per page
    const skip = (page - 1) * limit;

    // Build the "Where" clause dynamically
    const whereClause: any = {};

    // 1. Search Filter
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }

    // 2. Category Filter
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    // Execute queries in parallel: Fetch Data + Count Total (for pagination UI)
    const [apps, totalCount] = await prisma.$transaction([
      prisma.miniApp.findMany({
        where: whereClause,
        orderBy: { trendingScore: 'desc' }, // Show most relevant/trending first
        take: limit,
        skip: skip,
        include: { owner: true }
      }),
      prisma.miniApp.count({ where: whereClause })
    ]);

    const formattedApps = apps.map((app: any) => ({
      ...app,
      category: app.category as AppCategory,
      createdAt: app.createdAt.getTime(),
      authorUsername: app.owner?.username || "Unknown"
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({ 
      apps: formattedApps,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
  }
}