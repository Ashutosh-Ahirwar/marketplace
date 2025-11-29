import { verifyMessage } from 'viem';

export async function verifyUserAuth(payload: { fid: number, signature: string, message: string, nonce: string }) {
  if (!payload.signature || !payload.message) {
    throw new Error("Missing signature or message");
  }

  // Recover the address that signed the message
  const valid = await verifyMessage({
    address: payload.message.split('Address: ')[1]?.split('\n')[0] as `0x${string}`,
    message: payload.message,
    signature: payload.signature as `0x${string}`,
  });

  if (!valid) throw new Error("Invalid signature");
  if (!payload.message.includes(payload.nonce)) throw new Error("Invalid nonce");

  // RETURN THE ADDRESS (Lowercase for comparison)
  const recoveredAddress = payload.message.split('Address: ')[1]?.split('\n')[0].toLowerCase();
  return recoveredAddress; 
}