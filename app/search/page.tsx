'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { APP_CATEGORIES, AppCategory, MiniApp } from '@/types';
import OpenAppButton from '@/components/OpenAppButton';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('cat');
  const [apps, setApps] = useState<MiniApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await fetch('/api/apps');
        const data = await res.json();
        if (data.apps) setApps(data.apps);
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchApps();
  }, []);

  useEffect(() => {
    if (initialCat && APP_CATEGORIES.includes(initialCat as AppCategory)) {
      setSelectedCategory(initialCat);
    }
  }, [initialCat]);

  // Logic: Is the user actively searching or filtering?
  const isSearching = searchQuery.length > 0;
  const isFiltering = selectedCategory !== 'all';
  const showDiscoveryMode = !isSearching && !isFiltering;

  // Filter Logic
  const filteredApps = apps.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            app.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

  const trendingApps = [...apps].sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0)).slice(0, 5);
  const newArrivals = [...apps].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  if (isLoading) return <div className="p-10 text-center text-gray-400">Loading Market...</div>;

  return (
    <main className="max-w-md mx-auto min-h-screen bg-violet-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-violet-50/95 backdrop-blur-md px-4 pt-4 pb-2 border-b border-gray-100">
        <h1 className="text-2xl font-extrabold text-violet-950 mb-4">Explore</h1>
        
        {/* WARNING BANNER */}
        <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg flex gap-2 items-center mb-4">
          <div className="text-amber-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p className="text-[10px] text-amber-800 font-medium">Use external apps at your own risk.</p>
        </div>

        {/* Search Input */}
        <div className="relative shadow-sm mb-4">
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-white border border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/20" 
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* Categories Pills */}
        <div className="flex overflow-x-auto gap-2 py-2 no-scrollbar -mx-4 px-4">
          <button onClick={() => setSelectedCategory('all')} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === 'all' ? 'bg-violet-900 text-white' : 'bg-white text-gray-600 border'}`}>All</button>
          {APP_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap capitalize transition-all shadow-sm ${selectedCategory === cat ? 'bg-violet-900 text-white' : 'bg-white text-gray-600 border'}`}>{cat.replace('-', ' ')}</button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-24 pt-4">
        
        {/* MODE 1: DISCOVERY (Only show when NOT searching/filtering) */}
        {showDiscoveryMode && (
          <>
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4"><h2 className="text-lg font-bold text-slate-900">New Arrivals</h2></div>
              <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4">
                {newArrivals.map((app) => (
                  <div key={app.id} className="min-w-[140px] w-[140px] bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center relative group">
                    <img src={app.iconUrl} alt={app.name} className="w-12 h-12 rounded-xl bg-gray-100 object-cover mb-2 shadow-sm" />
                    <h3 className="font-bold text-sm text-slate-900 truncate w-full">{app.name}</h3>
                    <div className="w-full mt-auto"><OpenAppButton url={app.url} appId={app.id} /></div>
                  </div>
                ))}
              </div>
            </section>
            
            <section className="mb-8">
               <div className="flex items-center gap-2 mb-4"><h2 className="text-lg font-bold text-slate-900">Trending Now</h2></div>
               <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {trendingApps.map((app, i) => (
                  <div key={app.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <span className={`text-sm font-black w-6 text-center ${i < 3 ? 'text-amber-500' : 'text-gray-300'}`}>#{i + 1}</span>
                    <img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-lg bg-gray-100 object-cover" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{app.name}</h3>
                    </div>
                    <div className="w-20"><OpenAppButton url={app.url} appId={app.id} /></div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* MODE 2: SEARCH RESULTS (Grid view used for everything else) */}
        <section className="mt-4">
           {/* Section Title updates dynamically */}
           {!showDiscoveryMode && (
             <h2 className="text-lg font-bold text-slate-900 mb-4">
               {isSearching ? `Results for "${searchQuery}"` : `${selectedCategory.replace('-', ' ')} Apps`}
             </h2>
           )}

           {filteredApps.length === 0 ? (
             <div className="text-center text-gray-400 py-10 text-sm">No apps found matching your criteria.</div>
           ) : (
             <div className="grid grid-cols-2 gap-4">
              {/* If in Discovery Mode, we show filteredApps (which is everything) as a grid at the bottom? 
                  NO, to reduce clutter, we ONLY show the grid if the user is searching/filtering. 
                  However, if you want a "Browse All" at the bottom of Discovery, uncomment below.
              */}
              {(!showDiscoveryMode || true) && filteredApps.map(app => (
                // We add a key condition: if showing discovery, don't show the same apps again unless we paginate. 
                // For simplicity in this fix: If Discovery Mode is ON, we HIDE this grid to avoid duplicates.
                // If Discovery Mode is OFF, we SHOW this grid.
                (!showDiscoveryMode) && (
                  <div key={app.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3"><img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-lg bg-gray-100 object-cover" /></div>
                    <h3 className="font-bold text-sm text-slate-900 mb-1 truncate">{app.name}</h3>
                    <div className="mt-auto"><OpenAppButton url={app.url} appId={app.id} /></div>
                  </div>
                )
              ))}
            </div>
           )}
        </section>
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}