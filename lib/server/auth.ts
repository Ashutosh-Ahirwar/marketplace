import { verifyMessage } from 'viem';

export async function verifyUserAuth(payload: { fid: number, signature: string, message: string, nonce: string }) {
  if (!payload.signature || !payload.message) {
    throw new Error("Missing signature or message");
  }

  // 1. Verify the signature matches the message
  // Note: This assumes the signature is a standard EIP-191 Ethereum signature from the Farcaster connected wallet.
  // In a production environment, you must also verify that the recovered address OWNS the given FID 
  // by querying a Farcaster Hub or Neynar API.
  
  const valid = await verifyMessage({
    address: payload.message.split('Address: ')[1]?.split('\n')[0] as `0x${string}`, // Extract address from SIWE message if present, or pass explicitly
    message: payload.message,
    signature: payload.signature as `0x${string}`,
  });

  if (!valid) {
    throw new Error("Invalid signature");
  }

  // 2. Verify the Nonce matches (prevent replay attacks)
  if (!payload.message.includes(payload.nonce)) {
    throw new Error("Invalid nonce");
  }

  return true;
}