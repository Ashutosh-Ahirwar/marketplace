'use client'
import { sdk } from '@farcaster/miniapp-sdk'
import { MiniApp } from '@/types' 
import { useState, useRef, useEffect } from 'react';
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
  const [isPaused, setIsPaused] = useState(false); // Pause auto-play interaction
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper to scroll to specific index
  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      // Ensure index stays within bounds or wraps around
      const targetIndex = (index + featuredApps.length) % featuredApps.length;
      
      const child = scrollContainerRef.current.children[targetIndex] as HTMLElement;
      
      if (child) {
        // Account for the padding-left of the container (16px / 1rem from px-4)
        const scrollPos = child.offsetLeft - 16; 
        
        scrollContainerRef.current.scrollTo({
          left: scrollPos,
          behavior: 'smooth'
        });
      }
    }
  };

  // --- AUTO-PLAY LOGIC ---
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      scrollToIndex(activeIndex + 1);
    }, 4000); // 4 Seconds per slide

    return () => clearInterval(interval);
  }, [activeIndex, isPaused, featuredApps.length]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const width = scrollContainerRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      
      if (index !== activeIndex && index >= 0 && index < featuredApps.length) {
        setActiveIndex(index);
      }
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrollToIndex(activeIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrollToIndex(activeIndex + 1);
  };

  // --- NAVIGATION HANDLER ---
  const handleAppClick = async (app: MiniApp) => {
    try {
      const ctx = await sdk.context;
      
      if (ctx?.client && !ctx.client.added) {
        try { await sdk.actions.addMiniApp(); } catch (e) {}
      }

      console.log(`[Analytics] Open Featured - FID: ${ctx?.user?.fid || 0}, App: ${app.id}`);
      await sdk.actions.openMiniApp({ url: app.url });
    } catch (e) {
      console.error("Navigation failed", e);
    }
  };

  // --- RENTAL HANDLER ---
  const rentSlot = async (slotIndex: number) => {
    setLoadingIndex(slotIndex);
    setIsPaused(true); 
    
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
    finally { 
      setLoadingIndex(null); 
      setIsPaused(false); // Resume
    }
  };

  return (
    <div 
      className="mb-8 relative w-full group" // Added 'group' for hover effects
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
    > 
      <div className="flex justify-between items-end mb-3 px-1">
        <h2 className="text-lg font-extrabold text-violet-950 tracking-tight">Featured Launchpad</h2>
        <span className="text-xs font-mono text-violet-400 bg-violet-100 px-2 py-0.5 rounded-md">{activeIndex + 1} / 6</span>
      </div>

      {/* Navigation Buttons (Visible on hover or active interaction) */}
      <button 
        onClick={handlePrev}
        className="absolute left-2 top-[60%] -translate-y-1/2 z-10 bg-white/90 text-violet-700 p-2 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110 active:scale-95 disabled:opacity-0"
        aria-label="Previous Slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
      </button>

      <button 
        onClick={handleNext}
        className="absolute right-2 top-[60%] -translate-y-1/2 z-10 bg-white/90 text-violet-700 p-2 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110 active:scale-95 disabled:opacity-0"
        aria-label="Next Slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
      </button>

      <div 
        ref={scrollContainerRef}
        className="flex w-full overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar -mx-4 px-4" 
        onScroll={handleScroll}
        style={{ scrollBehavior: 'smooth' }}
      >
        {featuredApps.map((app, index) => (
          <div key={index} className="min-w-full snap-center pl-1 pr-1 first:pl-4 last:pr-4">
            {app ? (
              // OCCUPIED SLOT
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
                
                <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                    <OpenAppButton url={app.url} appId={app.id} variant="light" />
                </div>
              </div>
            ) : (
              // EMPTY SLOT
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