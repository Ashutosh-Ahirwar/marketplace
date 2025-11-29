'use client';
import { sdk } from "@farcaster/miniapp-sdk";
import { useState } from "react";

export default function OpenAppButton({ url, appId, variant = 'dark' }: { url: string, appId: string, variant?: 'dark' | 'light' }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const ctx = await sdk.context;
      
      // 1. Check/Prompt Bookmark before leaving
      if (ctx?.client && !ctx.client.added) {
        try {
          await sdk.actions.addMiniApp();
        } catch (e) {
          // User rejected bookmark, proceed anyway
          console.log("User declined bookmark");
        }
      }

      // 2. Open Target App
      // Analytics call removed
      await sdk.actions.openMiniApp({ url }); 
    } catch (e) {
      console.error("Failed to open app:", e);
      try { await sdk.actions.openMiniApp({ url }); } catch {}
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = "mt-auto w-full font-bold py-2.5 rounded-xl text-xs transition-all flex justify-center items-center shadow-sm active:scale-95 z-20 relative"; 
  
  const themeClasses = variant === 'dark' 
    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/20" 
    : "bg-white hover:bg-violet-50 text-violet-700";

  return (
    <button onClick={handleClick} disabled={loading} className={`${baseClasses} ${themeClasses}`}>
      {loading ? "Launching..." : "Open App"}
    </button>
  );
}