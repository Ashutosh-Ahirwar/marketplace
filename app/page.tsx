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
  const activeSlots = await prisma.featuredSlot.findMany({
    where: { expiresAt: { gt: new Date() } },
    include: { app: { include: { owner: true } } },
    orderBy: { slotIndex: 'asc' }
  });

  const featuredSlots: (MiniApp | null)[] = Array(6).fill(null);
  activeSlots.forEach((slot: any) => {
    featuredSlots[slot.slotIndex] = toMiniApp(slot.app);
  });

  const apps = await prisma.miniApp.findMany({
    take: 200, 
    orderBy: { trendingScore: 'desc' }, 
    include: { owner: true }
  });

  const categoryMap: Record<string, MiniApp[]> = {};
  APP_CATEGORIES.forEach(cat => { categoryMap[cat] = []; });
  apps.forEach((dbApp: any) => {
    const app = toMiniApp(dbApp);
    if (categoryMap[app.category]) {
      categoryMap[app.category].push(app);
    }
  });

  return (
    <main className="max-w-md mx-auto min-h-screen bg-violet-50">
      {/* Header */}
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
        
        {/* SAFETY WARNING BANNER */}
        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-3 items-start">
          <div className="text-amber-500 mt-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900">Do Your Own Research</h4>
            <p className="text-[10px] text-amber-700 leading-snug mt-0.5">
              MiniApp Mart does not audit listed apps. Interact with external apps at your own risk.
            </p>
          </div>
        </div>

        <FeaturedCarousel featuredApps={featuredSlots} />
        
        {Object.entries(categoryMap).map(([category, apps]) => {
          const displayItems = apps.length > 0 ? apps.slice(0, 8) : [null, null]; 
          return (
            <section key={category}>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-bold text-violet-900 tracking-tight capitalize">{formatCategory(category)}</h2>
                {apps.length > 0 && <a href={`/search?cat=${category}`} className="text-[11px] font-bold text-violet-600 hover:bg-violet-100 px-3 py-1.5 rounded-full transition-colors">View All</a>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {displayItems.map((app, i) => (
                  app ? (
                    <div key={app.id} className="group bg-white p-4 rounded-2xl shadow-sm border border-violet-100 flex flex-col relative overflow-hidden hover:shadow-md hover:border-violet-200 transition-all">
                        {app.isVerified && <div className="absolute top-3 right-3 text-blue-500 bg-blue-50 p-1 rounded-full"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>}
                        <div className="flex flex-col items-center text-center mb-3 mt-1">
                          <img src={app.iconUrl} alt={app.name} className="w-16 h-16 rounded-2xl shadow-sm mb-3 object-cover group-hover:scale-105 transition-transform duration-300" />
                          <h3 className="font-bold text-sm text-violet-900 truncate w-full">{app.name}</h3>
                          <span className="text-[10px] font-medium text-violet-400">@{app.authorUsername}</span>
                        </div>
                        <div className="mt-auto pt-2 w-full"><OpenAppButton url={app.url} appId={app.id} /></div>
                    </div>
                  ) : (
                    <div key={`placeholder-${i}`} className="bg-violet-50/50 border-2 border-dashed border-violet-200/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center h-full min-h-[180px] opacity-70 hover:opacity-100 transition-opacity">
                       <span className="text-2xl mb-2 grayscale opacity-50">✨</span>
                       <p className="text-xs font-bold text-violet-300">Coming Soon</p>
                       <a href="/list" className="mt-3 text-[10px] bg-white border border-violet-100 text-violet-500 font-bold px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors">List App</a>
                    </div>
                  )
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}