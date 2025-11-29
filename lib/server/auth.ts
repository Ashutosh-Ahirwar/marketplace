import { verifyMessage } from 'viem';

export async function verifyUserAuth(payload: { fid: number, signature: string, message: string, nonce: string }) {
  if (!payload.signature || !payload.message) {
    throw new Error("Missing signature or message");
  }

  // 1. Recover the address that signed the message
  const valid = await verifyMessage({
    address: payload.message.split('Address: ')[1]?.split('\n')[0] as `0x${string}`,
    message: payload.message,
    signature: payload.signature as `0x${string}`,
  });

  if (!valid) throw new Error("Invalid signature");
  
  // 2. Verify Nonce to prevent replay attacks
  if (!payload.message.includes(payload.nonce)) throw new Error("Invalid nonce");

  // Return recovered address for optional further checks
  const recoveredAddress = payload.message.split('Address: ')[1]?.split('\n')[0].toLowerCase();
  return recoveredAddress; 
}