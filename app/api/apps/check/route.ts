import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const existingApp = await prisma.miniApp.findUnique({
      where: { url }
    });

    return NextResponse.json({ 
      exists: !!existingApp,
      app: existingApp ? { name: existingApp.name, id: existingApp.id } : null
    });

  } catch (error) {
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}