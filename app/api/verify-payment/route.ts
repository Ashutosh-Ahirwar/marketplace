import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { txHash, ...details } = body;

    if (!txHash) {
      return NextResponse.json({ success: false, error: 'Missing Transaction Hash' }, { status: 400 });
    }

    // LOG FOR MANUAL VERIFICATION
    console.log("📝 [Transaction Submission]");
    console.log("Hash:", txHash);
    console.log("Details:", details);

    // In a real app, you would insert into your DB here with status="PENDING"
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}