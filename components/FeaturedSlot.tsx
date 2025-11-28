'use client'
import { sdk } from '@farcaster/miniapp-sdk'
import { MiniApp } from '@/types' 

interface FeaturedSlotProps {
  currentFeaturedApp: MiniApp | null;
}

export default function FeaturedSlot({ currentFeaturedApp }: FeaturedSlotProps) {
  const rentSlot = async (appId: string) => {
    // USDC on Base
    const USDC_ADDRESS = "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const PRICE_50_USD = "50000000"; // $50.00 USDC (6 decimals)

    try {
      const result = await sdk.actions.sendToken({
        token: USDC_ADDRESS,
        amount: PRICE_50_USD,
        recipientFid: 12345, // Replace with YOUR FID to receive payments
      });

      if (result.success) {
         // In production, send result.send.transaction to your API for verification
         console.log("Transaction Hash:", result.send.transaction);
         alert("Payment successful! Slot rented.");
      }
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  if (currentFeaturedApp) {
    return (
      <div className="bg-yellow-100 p-4 border-yellow-500 border rounded-lg mb-6">
        <h2 className="text-lg font-bold">🔥 Featured App</h2>
        <h3 className="text-xl mb-2">{currentFeaturedApp.name}</h3>
        <button 
          onClick={() => sdk.actions.openMiniApp({ url: currentFeaturedApp.url })}
          className="bg-black text-white px-4 py-2 rounded"
        >
           Open App
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-6 border-dashed border-2 border-gray-300 rounded-lg text-center mb-6">
      <h3 className="font-bold text-lg">Spotlight Empty!</h3>
      <p className="mb-4 text-gray-600">Display your app here for 24 hours.</p>
      {/* For demo purposes, we pass a dummy ID. In a real app, the user would select their app. */}
      <button 
        onClick={() => rentSlot('selected-app-id')} 
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Pay $50 to Feature
      </button>
    </div>
  );
}