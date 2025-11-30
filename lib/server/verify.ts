import { createPublicClient, http, parseAbiItem, decodeEventLog } from 'viem';
import { base } from 'viem/chains';
import { prisma } from '@/lib/prisma';
import { MARKETPLACE_CONFIG } from '@/lib/config';

// Initialize Alchemy Client
const client = createPublicClient({
  chain: base,
  transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)
});

const USDC_TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
);

export async function verifyPayment(txHash: string, expectedAmount: string, expectedSender?: string) {
  // 1. Check DB for Replay Attacks (Prevents using same hash twice)
  const existingTx = await prisma.transaction.findUnique({ where: { txHash } });
  if (existingTx) throw new Error("Transaction hash already used.");

  // 2. Fetch Receipt from Alchemy
  const receipt = await client.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

  if (receipt.status !== 'success') throw new Error("Transaction failed on-chain.");

  // 3. Find Relevant USDC Transfer Logs
  const usdcAddress = MARKETPLACE_CONFIG.tokens.baseUsdc.split(':')[2].toLowerCase();
  const recipient = MARKETPLACE_CONFIG.recipientAddress.toLowerCase();
  
  // Filter for logs that come from the USDC contract
  const usdcLogs = receipt.logs.filter(log => log.address.toLowerCase() === usdcAddress);

  if (usdcLogs.length === 0) throw new Error("No USDC transfer found in transaction.");

  // 4. Iterate through logs to find A VALID payment
  // A transaction might have multiple transfers (e.g. batch tx), so we look for ONE that satisfies our needs.
  let validPaymentFound = false;

  for (const log of usdcLogs) {
    try {
      const decoded = decodeEventLog({
        abi: [USDC_TRANSFER_EVENT],
        data: log.data,
        topics: log.topics
      });

      const to = decoded.args.to?.toLowerCase();
      const from = decoded.args.from?.toLowerCase(); 
      const value = decoded.args.value; 

      // Check 1: Is it sent to US?
      if (to !== recipient) continue;

      // Check 2: Is the amount sufficient?
      if (value && value < BigInt(expectedAmount)) continue;

      // Check 3: Anti-Hijacking (Optional)
      if (expectedSender && from !== expectedSender.toLowerCase()) continue;

      // If we got here, we found a valid payment log!
      validPaymentFound = true;
      break; 
    } catch (e) {
      // Ignore decoding errors for non-compliant logs and continue searching
      continue;
    }
  }

  if (!validPaymentFound) {
    throw new Error(`Transaction does not contain a valid payment of ${expectedAmount} USDC to the marketplace.`);
  }

  return true;
}