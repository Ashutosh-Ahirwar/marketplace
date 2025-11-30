'use client'
import { sdk } from "@farcaster/miniapp-sdk";

// Hardcoded Marketplace URL (matches your config)
const MARKETPLACE_URL = "https://marketplace-lovat-zeta.vercel.app";

interface ShareButtonProps {
  appName: string;
}

export default function ShareButton({ appName }: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card clicks
    e.preventDefault();
    
    // Construct Deep Link to Marketplace Search
    const deepLink = `${MARKETPLACE_URL}/search?q=${encodeURIComponent(appName)}`;

    try {
      await sdk.actions.composeCast({
        text: `Check out ${appName} on MiniApp Mart! 🚀`,
        embeds: [deepLink]
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="p-1.5 text-gray-400 bg-white/80 backdrop-blur-sm hover:text-violet-600 hover:bg-violet-100 rounded-full transition-colors shadow-sm border border-gray-100 z-20"
      title="Share App"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
      </svg>
    </button>
  );
}