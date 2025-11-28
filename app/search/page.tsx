'use client'
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
  const [showAllTrending, setShowAllTrending] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await fetch('/api/apps');
        const data = await res.json();
        if (data.apps) setApps(data.apps);
      } catch (e) {
        console.error("Failed to load apps");
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

  const filteredApps = apps
    .filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            app.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

  const trendingApps = [...apps].sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
  const displayedTrending = showAllTrending ? trendingApps.slice(0, 20) : trendingApps.slice(0, 3);
  const newArrivals = [...apps].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  if (isLoading) return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        <span className="text-xs font-medium text-gray-400">Loading Market...</span>
      </div>
    </div>
  );

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md px-4 pt-4 pb-2 border-b border-gray-100">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-4">Explore</h1>
        <div className="relative shadow-sm mb-4">
          <input type="text" placeholder="Search apps, games, utilities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20" />
          <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex overflow-x-auto gap-2 py-2 no-scrollbar -mx-4 px-4">
          <button onClick={() => setSelectedCategory('all')} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-gray-600 border'}`}>All</button>
          {APP_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap capitalize transition-all shadow-sm ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-white text-gray-600 border'}`}>{cat.replace('-', ' ')}</button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-24 pt-4">
        {/* Only show "Just In" and "Trending" if we have apps */}
        {!searchQuery && selectedCategory === 'all' && apps.length > 0 && (
          <>
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4"><h2 className="text-lg font-bold text-slate-900">New Arrivals</h2><span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">FRESH</span></div>
              <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4">
                {newArrivals.map((app) => (
                  <div key={app.id} className="min-w-[140px] w-[140px] bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center relative group">
                    <img src={app.iconUrl} alt={app.name} className="w-12 h-12 rounded-xl bg-gray-100 object-cover mb-2 shadow-sm group-hover:scale-105 transition-transform" />
                    <h3 className="font-bold text-sm text-slate-900 truncate w-full">{app.name}</h3>
                    <div className="w-full mt-auto"><OpenAppButton url={app.url} appId={app.id} /></div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Trending</h2>
                <button onClick={() => setShowAllTrending(!showAllTrending)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">{showAllTrending ? "Show Less" : "View Top 20"}</button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {displayedTrending.map((app, i) => (
                  <div key={app.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <span className={`text-sm font-black w-6 text-center ${i < 3 ? 'text-yellow-500 text-lg' : 'text-gray-300'}`}>#{i + 1}</span>
                    <img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-lg bg-gray-100 object-cover" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{app.name}</h3>
                      <p className="text-xs text-gray-500">{app.uniqueViews} views</p>
                    </div>
                    <div className="w-20"><OpenAppButton url={app.url} appId={app.id} /></div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Filtered Grid or Empty State */}
        <section className="mt-4">
           {searchQuery && <h2 className="text-lg font-bold text-slate-900 mb-4">Results</h2>}
           
           {filteredApps.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
               <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
               <h3 className="text-base font-bold text-slate-900">No Apps Found</h3>
               <p className="text-sm text-gray-500 max-w-[200px]">
                 We couldn't find anything for "{searchQuery || selectedCategory}".
               </p>
               <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="mt-4 text-blue-600 text-xs font-bold hover:underline">
                 Clear Filters
               </button>
             </div>
           ) : (
             <div className="grid grid-cols-2 gap-4">
              {filteredApps.map(app => (
                <div key={app.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3"><img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-lg bg-gray-100 object-cover" /></div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1 truncate">{app.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8">{app.description}</p>
                  <div className="mt-auto"><OpenAppButton url={app.url} appId={app.id} /></div>
                </div>
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