import FeaturedCarousel from "@/components/FeaturedCarousel";
import OpenAppButton from "@/components/OpenAppButton";
import AddToHomeButton from "@/components/AddToHomeButton"; 
import { MiniApp, APP_CATEGORIES } from "@/types"; 
import { prisma } from "@/lib/prisma"; 

export const dynamic = 'force-dynamic'; 

const formatCategory = (cat: string) => cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const toMiniApp = (data: any): MiniApp => ({
  ...data,
  category: data.category as any,
  createdAt: data.createdAt.getTime(),
  authorUsername: data.owner?.username || "Unknown"
});

export default async function Home() {
  // 1. Fetch Featured Slots
  const activeSlots = await prisma.featuredSlot.findMany({
    where: { expiresAt: { gt: new Date() } },
    include: { app: { include: { owner: true } } },
    orderBy: { slotIndex: 'asc' },
    take: 6 // Strict limit
  });

  const featuredSlots: (MiniApp | null)[] = Array(6).fill(null);
  activeSlots.forEach((slot: any) => {
    featuredSlots[slot.slotIndex] = toMiniApp(slot.app);
  });

  // 2. Fetch Top Apps (Limited to top 50 for performance)
  const appsData = await prisma.miniApp.findMany({
    orderBy: { trendingScore: 'desc' }, 
    include: { owner: true },
    take: 50 // SCALABILITY FIX: Limit query
  });
  
  const allApps = appsData.map(toMiniApp);

  // Leaderboard (Top 5)
  const leaderboardApps = allApps.slice(0, 5);

  // Organize Categories
  const categoryMap: Record<string, MiniApp[]> = {};
  APP_CATEGORIES.forEach(cat => { categoryMap[cat] = []; });
  
  allApps.forEach((app) => {
    if (categoryMap[app.category]) {
      categoryMap[app.category].push(app);
    }
  });

  // Sort Categories: Non-empty first
  const sortedCategories = Object.entries(categoryMap).sort(([, a], [, b]) => b.length - a.length);

  return (
    <main className="max-w-md mx-auto min-h-screen bg-violet-50">
      <div className="sticky top-0 z-40 bg-violet-50/90 backdrop-blur-sm px-4 py-4 mb-2 flex items-center justify-between border-b border-violet-100/50">
        <h1 className="text-2xl font-extrabold tracking-tight text-violet-950 flex items-center">
          Mini
          <span className="relative w-7 h-7 mx-[1px] flex items-center justify-center transform -rotate-12 translate-y-[1px]">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rocket-icon.png" alt="A" className="w-full h-full object-contain drop-shadow-sm" />
          </span>
          pp<span className="text-violet-600">Mart</span>
        </h1>
        <div className="flex items-center gap-3">
          <AddToHomeButton />
        </div>
      </div>

      <div className="px-4 pb-24 space-y-8">
        <FeaturedCarousel featuredApps={featuredSlots} />

        {/* LEADERBOARD SECTION */}
        {leaderboardApps.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-violet-900 tracking-tight">Top Trending</h2>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">HOT</span>
            </div>
            <div className="space-y-3">
              {leaderboardApps.map((app, i) => (
                <div key={app.id} className="bg-white p-3 rounded-xl border border-violet-100 shadow-sm flex items-center gap-4">
                   <span className={`text-lg font-black w-6 text-center ${i < 3 ? 'text-amber-500' : 'text-gray-300'}`}>#{i + 1}</span>
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={app.iconUrl} className="w-12 h-12 rounded-lg bg-gray-100 object-cover" />
                   <div className="flex-1 min-w-0">
                     <h3 className="font-bold text-sm text-slate-900 truncate">{app.name}</h3>
                     <p className="text-[10px] text-gray-400 truncate">@{app.authorUsername}</p>
                   </div>
                   <div className="w-20">
                     <OpenAppButton url={app.url} appId={app.id} />
                   </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* CATEGORIES */}
        {sortedCategories.map(([category, apps]) => {
          if (apps.length === 0) return null; 

          return (
            <section key={category}>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-bold text-violet-900 tracking-tight capitalize">{formatCategory(category)}</h2>
                <a href={`/search?cat=${category}`} className="text-[11px] font-bold text-violet-600 hover:bg-violet-100 px-3 py-1.5 rounded-full transition-colors">
                  View All
                </a>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {apps.slice(0, 8).map((app) => (
                  <div key={app.id} className="group bg-white p-4 rounded-2xl shadow-sm border border-violet-100 flex flex-col relative overflow-hidden hover:shadow-md hover:border-violet-200 transition-all h-full">
                      {app.isVerified && (
                        <div className="absolute top-3 right-3 text-blue-500 bg-blue-50 p-1 rounded-full z-10">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center text-center mb-2 mt-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={app.iconUrl} alt={app.name} className="w-16 h-16 rounded-2xl shadow-sm mb-3 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <h3 className="font-bold text-sm text-violet-900 truncate w-full">{app.name}</h3>
                        <span className="text-[10px] font-medium text-violet-400 mb-2">@{app.authorUsername}</span>
                        <p className="text-[10px] text-gray-400 line-clamp-2 h-8 leading-tight">{app.description}</p>
                      </div>
                      
                      <div className="mt-auto pt-2 w-full">
                        <OpenAppButton url={app.url} appId={app.id} />
                      </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}