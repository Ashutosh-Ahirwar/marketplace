'use client'
import { sdk } from '@farcaster/miniapp-sdk'
import { MiniApp } from '@/types' 
import { useState, useRef } from 'react'; // Added useRef
import OpenAppButton from './OpenAppButton';
import { MARKETPLACE_CONFIG } from '@/lib/config';
import { useRouter } from 'next/navigation';

interface FeaturedCarouselProps {
  featuredApps: (MiniApp | null)[];
}

export default function FeaturedCarousel({ featuredApps }: FeaturedCarouselProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  
  // Use ref to calculate scroll position more accurately if needed
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const width = scrollContainerRef.current.offsetWidth;
      // Calculate index based on center of scroll view
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    }
  };

  // NEW: Handle Card Click for Navigation
  const handleAppClick = async (app: MiniApp) => {
    try {
      const ctx = await sdk.context;
      
      // Bookmark Check (Consistent with OpenAppButton)
      if (ctx?.client && !ctx.client.added) {
        try { await sdk.actions.addMiniApp(); } catch (e) {}
      }

      // Analytics
      console.log(`[Analytics] Open Featured - FID: ${ctx?.user?.fid || 0}, App: ${app.id}`);
      
      // Open App
      await sdk.actions.openMiniApp({ url: app.url });
    } catch (e) {
      console.error("Navigation failed", e);
    }
  };

  const rentSlot = async (slotIndex: number) => {
    setLoadingIndex(slotIndex);
    try {
      const ctx = await sdk.context;
      const user = ctx?.user;
      if (!user) { alert("Please connect your Farcaster account."); return; }

      const result = await sdk.actions.sendToken({
        token: MARKETPLACE_CONFIG.tokens.baseUsdc,
        amount: MARKETPLACE_CONFIG.prices.featuredUsdc,
        recipientAddress: MARKETPLACE_CONFIG.recipientAddress, 
      });

      if (result.success) {
        const txHash = result.send.transaction;
        const res = await fetch('/api/apps/feature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txHash, fid: user.fid, slotIndex, appId: "placeholder", user })
        });
        const data = await res.json();
        if (data.success) { alert(`Slot Secured!`); router.refresh(); }
        else throw new Error(data.error);
      }
    } catch (error: any) { alert(`Error: ${error.message}`); } 
    finally { setLoadingIndex(null); }
  };

  return (
    <div className="mb-8 relative w-full"> {/* Ensure full width relative container */}
      <div className="flex justify-between items-end mb-3 px-1">
        <h2 className="text-lg font-extrabold text-violet-950 tracking-tight">Featured Launchpad</h2>
        <span className="text-xs font-mono text-violet-400 bg-violet-100 px-2 py-0.5 rounded-md">{activeIndex + 1} / 6</span>
      </div>

      {/* SCROLL CONTAINER FIXES:
         1. ref={scrollContainerRef} for JS access
         2. w-full to ensure it takes space
         3. -mx-4 px-4 to allow full-bleed scrolling on mobile while keeping padding
      */}
      <div 
        ref={scrollContainerRef}
        className="flex w-full overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar -mx-4 px-4" 
        onScroll={handleScroll}
        style={{ scrollBehavior: 'smooth' }} // Smooth scrolling for programmatic moves
      >
        {featuredApps.map((app, index) => (
          // min-w-full ensures one card takes up the whole view width (minus padding)
          <div key={index} className="min-w-full snap-center pl-1 pr-1 first:pl-4 last:pr-4">
            {app ? (
              // OCCUPIED SLOT - Now Fully Clickable
              <div 
                onClick={() => handleAppClick(app)}
                className="bg-gradient-to-br from-[#5D45BA] to-[#3B2885] p-6 rounded-3xl text-white shadow-xl shadow-violet-500/20 h-48 flex flex-col relative overflow-hidden ring-1 ring-white/20 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="absolute top-0 right-0 bg-white/10 backdrop-blur-md px-3 py-1 rounded-bl-2xl text-[10px] font-bold border-l border-b border-white/10 text-amber-300">
                  FEATURED
                </div>
                <div className="flex items-center gap-4 mb-3 mt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={app.iconUrl} alt={app.name} className="w-14 h-14 rounded-xl bg-white/10 shadow-md object-cover ring-2 ring-white/20" />
                  <div>
                    <h3 className="text-lg font-bold leading-tight">{app.name}</h3>
                    <p className="text-violet-200 text-xs mt-0.5">by @{app.authorUsername}</p>
                  </div>
                </div>
                <p className="text-xs text-violet-100 line-clamp-2 mb-3 leading-relaxed">{app.description}</p>
                
                {/* Stop propagation on the button so we don't trigger double clicks, though logic is safe regardless */}
                <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                    <OpenAppButton url={app.url} appId={app.id} variant="light" />
                </div>
              </div>
            ) : (
              // EMPTY SLOT - Rent Me
              <div className="bg-white border-2 border-dashed border-violet-200 p-6 rounded-3xl h-48 flex flex-col items-center justify-center text-center shadow-sm relative group hover:border-violet-400 transition-colors">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1.5 mt-2">Slot #{index + 1}</span>
                <h3 className="text-violet-900 font-bold text-lg mb-0.5">Launch Your App</h3>
                <p className="text-xs text-gray-500 mb-5">{MARKETPLACE_CONFIG.labels.featuredPrice} / 24h</p>
                
                <button 
                  onClick={() => rentSlot(index)} 
                  disabled={loadingIndex === index}
                  className="bg-amber-400 hover:bg-amber-500 text-amber-950 px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-amber-400/30 active:scale-95"
                >
                  {loadingIndex === index ? "Processing..." : "Rent This Slot"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-center gap-1.5 mt-[-12px]">
        {featuredApps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-6 bg-violet-600" : "w-1.5 bg-violet-200"}`} />
        ))}
      </div>
    </div>
  );
}