import { createPublicClient, http, parseAbiItem, decodeEventLog } from 'viem';
import { base } from 'viem/chains';
import { prisma } from '@/lib/prisma';
import { MARKETPLACE_CONFIG } from '@/lib/config';

const client = createPublicClient({
  chain: base,
  transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)
});

const USDC_TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
);

// Added optional 'expectedSender' argument
export async function verifyPayment(txHash: string, expectedAmount: string, expectedSender?: string) {
  // 1. Check DB for Replay Attacks
  const existingTx = await prisma.transaction.findUnique({ where: { txHash } });
  if (existingTx) throw new Error("Transaction hash already used.");

  // 2. Fetch Receipt
  const receipt = await client.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
  if (receipt.status !== 'success') throw new Error("Transaction failed on-chain.");

  // 3. Find USDC Transfer Log
  const usdcAddress = MARKETPLACE_CONFIG.tokens.baseUsdc.split(':')[2].toLowerCase();
  const transferLog = receipt.logs.find(log => log.address.toLowerCase() === usdcAddress);
  
  if (!transferLog) throw new Error("No USDC transfer found.");

  // 4. Decode
  const decoded = decodeEventLog({
    abi: [USDC_TRANSFER_EVENT],
    data: transferLog.data,
    topics: transferLog.topics
  });

  const to = decoded.args.to?.toLowerCase();
  const from = decoded.args.from?.toLowerCase(); // Get the sender
  const value = decoded.args.value; 

  // 5. Verify Details
  if (to !== MARKETPLACE_CONFIG.recipientAddress.toLowerCase()) {
    throw new Error("Payment recipient wrong.");
  }

  if (value && value < BigInt(expectedAmount)) {
    throw new Error("Insufficient payment amount.");
  }

  // 6. ANTI-HIJACKING CHECK
  if (expectedSender && from !== expectedSender.toLowerCase()) {
    throw new Error(`Payment hijacking detected! Wallet ${from} paid, but authenticated user is ${expectedSender}`);
  }

  return true;
}