'use client'
import { sdk } from "@farcaster/miniapp-sdk";

interface ShareButtonProps {
  appName: string;
  appUrl: string;
}

export default function ShareButton({ appName, appUrl }: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    try {
      await sdk.actions.composeCast({
        text: `Check out ${appName} on MiniApp Mart!`,
        embeds: [appUrl]
      }); // [cite: 614, 619, 620]
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
      title="Share to Feed"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
      </svg>
    </button>
  );
}