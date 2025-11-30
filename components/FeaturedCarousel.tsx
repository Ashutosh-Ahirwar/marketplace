'use client'
import { sdk } from '@farcaster/miniapp-sdk'
import { MiniApp } from '@/types' 
import { useState, useRef, useEffect } from 'react';
import OpenAppButton from './OpenAppButton';
import { MARKETPLACE_CONFIG } from '../lib/config';
import { useRouter } from 'next/navigation';

interface FeaturedCarouselProps {
  featuredApps: (MiniApp | null)[];
}

export default function FeaturedCarousel({ featuredApps }: FeaturedCarouselProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [myApps, setMyApps] = useState<MiniApp[]>([]);
  const [showSelector, setShowSelector] = useState<number | null>(null); 
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      scrollToIndex(activeIndex + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeIndex, isPaused, featuredApps.length]);

  useEffect(() => {
    const fetchMyApps = async () => {
      try {
        const ctx = await sdk.context;
        if (ctx?.user?.fid) {
          const res = await fetch(`/api/user/${ctx.user.fid}`);
          const data = await res.json();
          if (data.listings) setMyApps(data.listings);
        }
      } catch (e) {
        console.error("Failed to load user apps", e);
      }
    };
    fetchMyApps();
  }, []);

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const len = featuredApps.length;
      const targetIndex = (index % len + len) % len;
      
      const child = scrollContainerRef.current.children[targetIndex] as HTMLElement;
      if (child) {
        const scrollPos = child.offsetLeft - 16; 
        scrollContainerRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }
  };

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
    setIsPaused(true);
    scrollToIndex(activeIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(true);
    scrollToIndex(activeIndex + 1);
  };

  const handleAppClick = async (app: MiniApp) => {
    try {
      const ctx = await sdk.context;
      if (ctx?.client && !ctx.client.added) {
        try { await sdk.actions.addMiniApp(); } catch (e) {}
      }
      await sdk.actions.openMiniApp({ url: app.url });
    } catch (e) {
      console.error("Navigation failed", e);
    }
  };

  const startRentProcess = (slotIndex: number) => {
    setIsPaused(true);
    if (myApps.length === 0) {
      showToast("You need to list an app first before you can feature it!", 'error');
      return;
    }
    setShowSelector(slotIndex);
  };

  const confirmRent = async (slotIndex: number, appId: string) => {
    setLoadingIndex(slotIndex);
    setShowSelector(null);
    
    try {
      const ctx = await sdk.context;
      const user = ctx?.user;
      if (!user) { 
        showToast("Please connect your Farcaster account.", 'error'); 
        return; 
      }

      // 1. GET AUTH TOKEN (Quick Auth - Silent)
      const { token } = await sdk.quickAuth.getToken();
      if (!token) throw new Error("Failed to authenticate.");

      // 2. SEND TOKEN
      const result = await sdk.actions.sendToken({
        token: MARKETPLACE_CONFIG.tokens.baseUsdc,
        amount: MARKETPLACE_CONFIG.prices.featuredUsdc,
        recipientAddress: MARKETPLACE_CONFIG.recipientAddress, 
      });

      if (result.success) {
        const txHash = result.send.transaction;
        
        // 3. CALL API WITH AUTH TOKEN
        const res = await fetch('/api/featured', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            txHash, 
            fid: user.fid, 
            slotIndex, 
            appId,
            auth: { token } // Using Token instead of Signature
          })
        });
        const data = await res.json();
        if (data.success) { 
          showToast(`Slot Secured!`, 'success'); 
          router.refresh(); 
        }
        else throw new Error(data.error);
      }
    } catch (error: any) { 
      showToast(`Error: ${error.message}`, 'error'); 
    } 
    finally { 
      setLoadingIndex(null); 
      setIsPaused(false); 
    }
  };

  return (
    <div 
      className="mb-8 relative w-full group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    > 
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-xs font-bold animate-fade-in-down transition-all ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
        }`}>
            {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-3 px-1">
        <h2 className="text-lg font-extrabold text-violet-950 tracking-tight">Featured Apps</h2>
        <div className="bg-violet-100 text-violet-600 text-[10px] font-bold px-2 py-1 rounded-full">
          {activeIndex + 1} / 6
        </div>
      </div>

      <div className="relative">
        <button 
          onClick={handlePrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white text-violet-600 p-2 rounded-full shadow-md border border-violet-100 hover:scale-110 active:scale-95 transition-all -ml-2"
          aria-label="Previous"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>

        <button 
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white text-violet-600 p-2 rounded-full shadow-md border border-violet-100 hover:scale-110 active:scale-95 transition-all -mr-2"
          aria-label="Next"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex w-full overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar px-1"
          onScroll={handleScroll}
          style={{ scrollBehavior: 'smooth' }}
        >
          {featuredApps.map((app, index) => (
            <div key={index} className="min-w-full snap-center">
              {app ? (
                <div 
                  onClick={() => handleAppClick(app)}
                  className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-lg shadow-violet-500/20 h-52 flex flex-col relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform border border-white/10"
                >
                  <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 text-amber-300 shadow-sm">
                    FEATURED
                  </div>
                  <div className="flex items-center gap-4 mb-3 mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={app.iconUrl} alt={app.name} className="w-16 h-16 rounded-2xl bg-white/10 shadow-md object-cover ring-2 ring-white/20" />
                    <div>
                      <h3 className="text-xl font-bold leading-tight mb-1">{app.name}</h3>
                      <p className="text-violet-200 text-xs font-medium bg-black/20 px-2 py-0.5 rounded-lg inline-block">by @{app.authorUsername}</p>
                    </div>
                  </div>
                  <p className="text-xs text-violet-100 line-clamp-2 mb-4 leading-relaxed opacity-90">{app.description}</p>
                  <div className="mt-auto z-10" onClick={(e) => e.stopPropagation()}>
                      <OpenAppButton url={app.url} appId={app.id} variant="light" />
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute -top-10 -left-10 w-24 h-24 bg-purple-400/20 rounded-full blur-xl"></div>
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-violet-200 p-6 rounded-3xl h-52 flex flex-col items-center justify-center text-center shadow-sm relative group hover:border-violet-400 hover:bg-violet-50/30 transition-all">
                  <div className="bg-violet-100 text-violet-500 w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <h3 className="text-violet-950 font-bold text-lg mb-1">Empty Slot #{index + 1}</h3>
                  <p className="text-xs text-gray-500 mb-5 max-w-[200px]">Get 24h visibility on the homepage for {MARKETPLACE_CONFIG.labels.featuredPrice}</p>
                  
                  {showSelector === index ? (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 rounded-3xl p-4 flex flex-col animate-fade-in border border-violet-200">
                      <p className="text-xs font-bold text-violet-900 mb-2">Select App:</p>
                      <div className="flex-1 overflow-y-auto mb-2 space-y-1">
                        {myApps.map(myApp => (
                          <button 
                             key={myApp.id}
                             onClick={() => confirmRent(index, myApp.id)}
                             className="w-full text-left text-xs p-2 rounded-lg hover:bg-violet-100 text-violet-700 font-medium truncate transition-colors"
                          >
                            {myApp.name}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setShowSelector(null)} className="text-[10px] text-gray-400 hover:text-red-500 font-bold py-2 border-t border-gray-100">CANCEL</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => startRentProcess(index)} 
                      disabled={loadingIndex === index}
                      className="bg-amber-400 hover:bg-amber-500 text-amber-950 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-400/20 active:scale-95 w-full max-w-[180px]"
                    >
                      {loadingIndex === index ? "Processing..." : "Rent Now"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center gap-2 mt-2">
        {featuredApps.map((_, i) => (
          <button 
            key={i} 
            onClick={() => {
              setIsPaused(true);
              scrollToIndex(i);
            }}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex ? "w-6 bg-violet-600" : "w-2 bg-violet-200 hover:bg-violet-300"}`} 
          />
        ))}
      </div>
    </div>
  );
}