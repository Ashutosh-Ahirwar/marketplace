"use client";
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect, useState } from "react";

export default function SDKProvider({ children }: { children: React.ReactNode }) {
  const [paddingBottom, setPaddingBottom] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const context = await sdk.context;
        if (context?.client?.safeAreaInsets?.bottom) {
          setPaddingBottom(context.client.safeAreaInsets.bottom);
        }
        await sdk.actions.ready();
        setIsReady(true);
      } catch (e) {
        console.error("SDK Init Error:", e);
        setIsReady(true); 
      }
    };
    init();
  }, []);

  if (!isReady) return null;

  return (
    <div style={{ paddingBottom: `${paddingBottom}px` }}>
      {children}
    </div>
  );
}