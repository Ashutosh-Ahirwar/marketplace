"use client";
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect, useState } from "react";

export default function SDKProvider({ children }: { children: React.ReactNode }) {
  const [paddingBottom, setPaddingBottom] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Attempt to get context
        const context = await sdk.context;
        
        // Apply Safe Area Insets if available
        if (context?.client?.safeAreaInsets?.bottom) {
          setPaddingBottom(context.client.safeAreaInsets.bottom);
        }
      } catch (e) {
        console.warn("SDK Context Warning:", e);
      } finally {
        // CRITICAL: Always call ready() to dismiss splash screen, 
        // even if context loading had minor issues.
        await sdk.actions.ready();
        setIsReady(true);
      }
    };
    
    init();
  }, []);

  // Optional: Show nothing until ready to prevent layout shifts, 
  // or show children immediately if you prefer optimistic rendering.
  if (!isReady) return null; 

  return (
    <div style={{ paddingBottom: `${paddingBottom}px` }}>
      {children}
    </div>
  );
}