'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { APP_CATEGORIES, AppCategory, MiniApp } from '@/types';
import OpenAppButton from '@/components/OpenAppButton';
import ShareButton from '@/components/ShareButton'; // Imported ShareButton

// Debounce hook to prevent API spam while typing
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('cat');
  
  const [apps, setApps] = useState<MiniApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Trending Section State
  const [isTrendingExpanded, setIsTrendingExpanded] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search input (wait 500ms after typing stops)
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Sync URL params with state on load
  useEffect(() => {
    if (initialCat && APP_CATEGORIES.includes(initialCat as AppCategory)) {
      setSelectedCategory(initialCat);
    }
  }, [initialCat]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory]);

  // Fetch Data whenever filters or page changes
  useEffect(() => {
    const fetchApps = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (selectedCategory && selectedCategory !== 'all') params.set('cat', selectedCategory);
        
        // Add Pagination Params
        params.set('page', page.toString());
        params.set('limit', '20'); // Fetch 20 items per page
        
        const res = await fetch(`/api/apps?${params.toString()}`);
        const data = await res.json();
        
        if (data.apps) {
          setApps(data.apps);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
  }, [debouncedSearch, selectedCategory, page]);

  const isSearching = searchQuery.length > 0;
  const isFiltering = selectedCategory !== 'all';
  
  // Only show "Discovery Mode" (Carousels) on Page 1 with no filters
  const showDiscoveryMode = !isSearching && !isFiltering && page === 1;

  // Since we are paging server-side, 'apps' contains only the current page's data
  const filteredApps = apps; 

  // Discovery mode helpers (for Page 1 only)
  // Sort full list by trending score
  const sortedTrending = [...apps].sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
  // Determine display count based on expansion state (Top 5 vs Top 20)
  const displayedTrending = isTrendingExpanded ? sortedTrending : sortedTrending.slice(0, 5);
  
  const newArrivals = [...apps].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
        
        {/* MODE 1: DISCOVERY (Only show when NOT searching/filtering AND on Page 1) */}
        {showDiscoveryMode && (
          <>
            {/* 1. TRENDING NOW */}
            <section className="mb-8">
               <div className="flex items-center justify-between mb-4 px-1">
                 <div className="flex items-center gap-2"><h2 className="text-lg font-bold text-slate-900">Trending Now</h2></div>
                 
                 {/* VIEW ALL TOGGLE */}
                 <button 
                   onClick={() => setIsTrendingExpanded(!isTrendingExpanded)}
                   className="text-[11px] font-bold text-violet-600 hover:bg-violet-100 px-3 py-1.5 rounded-full transition-colors"
                 >
                   {isTrendingExpanded ? "Show Less" : "View All"}
                 </button>
               </div>

               <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {displayedTrending.map((app, i) => (
                  <div key={app.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <span className={`text-sm font-black w-6 text-center ${i < 3 ? 'text-amber-500' : 'text-gray-300'}`}>#{i + 1}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-lg bg-gray-100 object-cover" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{app.name}</h3>
                      <p className="text-[10px] text-gray-400 truncate">@{app.authorUsername}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShareButton appName={app.name} />
                        <div className="w-20"><OpenAppButton url={app.url} appId={app.id} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. JUST IN */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4"><h2 className="text-lg font-bold text-slate-900">Just In</h2></div>
              {isLoading ? <div className="text-center text-xs text-gray-400">Loading...</div> : (
              <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4">
                {newArrivals.map((app) => (
                  <div key={app.id} className="min-w-[150px] w-[150px] bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center relative group">
                    {/* ADDED: Share Button */}
                    <div className="absolute top-2 right-2 z-10"><ShareButton appName={app.name} /></div>
                    
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={app.iconUrl} alt={app.name} className="w-12 h-12 rounded-xl bg-gray-100 object-cover mb-2 shadow-sm" />
                    <h3 className="font-bold text-sm text-slate-900 truncate w-full">{app.name}</h3>
                    <span className="text-[10px] font-medium text-violet-400 mb-2">@{app.authorUsername}</span>
                    
                    {/* Scrollable Description */}
                    <p className="text-[10px] text-gray-400 h-8 leading-tight overflow-y-auto no-scrollbar w-full px-1 mb-2">
                      {app.description}
                    </p>

                    <div className="w-full mt-auto"><OpenAppButton url={app.url} appId={app.id} /></div>
                  </div>
                ))}
              </div>
              )}
            </section>
          </>
        )}

        {/* MODE 2: SEARCH RESULTS (Grid View) */}
        {(!showDiscoveryMode || isSearching || isFiltering || page > 1) && (
        <section className="mt-4">
           <h2 className="text-lg font-bold text-slate-900 mb-4">
             {isSearching ? `Results for "${searchQuery}"` : `${selectedCategory.replace('-', ' ')} Apps`}
           </h2>

           {isLoading ? (
             <div className="text-center text-gray-400 py-10 text-sm">Searching...</div>
           ) : filteredApps.length === 0 ? (
             <div className="text-center text-gray-400 py-10 text-sm">No apps found.</div>
           ) : (
             <>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {filteredApps.map(app => (
                      <div key={app.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                        {/* ADDED: Share Button */}
                        <div className="absolute top-2 right-2 z-10"><ShareButton appName={app.name} /></div>

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={app.iconUrl} alt={app.name} className="w-12 h-12 rounded-2xl shadow-sm mb-3 object-cover" />
                        <h3 className="font-bold text-sm text-slate-900 truncate w-full">{app.name}</h3>
                        <span className="text-[10px] font-medium text-violet-400 mb-2">@{app.authorUsername}</span>
                        
                        {/* Scrollable Description */}
                        <p className="text-[10px] text-gray-400 h-8 leading-tight overflow-y-auto no-scrollbar w-full px-1 mb-3">
                          {app.description}
                        </p>

                        <div className="mt-auto w-full"><OpenAppButton url={app.url} appId={app.id} /></div>
                      </div>
                  ))}
                </div>

                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mb-8">
                    <button 
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-mono text-gray-400">Page {page} of {totalPages}</span>
                    <button 
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
             </>
           )}
        </section>
        )}
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