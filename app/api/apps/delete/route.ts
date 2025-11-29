import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserAuth } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
    const { appId, fid, auth } = await req.json();

    // 0. Security Check
    if (!auth || !auth.signature) {
      return NextResponse.json({ error: "Unauthorized: Missing signature" }, { status: 401 });
    }
    
    await verifyUserAuth({ 
      fid: fid, 
      signature: auth.signature, 
      message: auth.message, 
      nonce: auth.nonce 
    });

    // 1. Verify Ownership
    const app = await prisma.miniApp.findUnique({
      where: { id: appId }
    });

    if (!app || app.ownerFid !== fid) {
      return NextResponse.json({ error: "Unauthorized: You do not own this app" }, { status: 403 });
    }

    // 2. Delete
    await prisma.miniApp.delete({
      where: { id: appId }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Delete Error", error);
    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
  }
}