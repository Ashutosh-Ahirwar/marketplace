'use client'
import { sdk } from '@farcaster/miniapp-sdk'
import { useState, useEffect } from 'react'
import { Transaction, MiniApp } from '@/types'
import OpenAppButton from '@/components/OpenAppButton'

// Type for Featured Slot (extending what we get from API)
interface FeaturedSlotItem {
  slotIndex: number;
  app: MiniApp;
  expiresAt: string; // ISO string date
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ fid: number; username?: string; pfpUrl?: string } | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [myListings, setMyListings] = useState<MiniApp[]>([]);
  
  // NEW: State for my featured slots
  const [myFeatured, setMyFeatured] = useState<FeaturedSlotItem[]>([]);
  
  const [activeTab, setActiveTab] = useState<'listings' | 'history'>('listings');
  const [isLoading, setIsLoading] = useState(true);
  
  // Delete States
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // holds ID (appId or slotIndex)
  const [confirmingId, setConfirmingId] = useState<string | null>(null); // for regular delete
  
  // Featured Delete Logic
  const [featuredToDelete, setFeaturedToDelete] = useState<FeaturedSlotItem | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refreshData = async (fid: number) => {
    try {
      const res = await fetch(`/api/user/${fid}`);
      const data = await res.json();
      if (data.listings) setMyListings(data.listings);
      if (data.transactions) setHistory(data.transactions);
      
      // NEW: Also fetch active featured slots. 
      // ideally the /api/user/[fid] endpoint would return this, but we can fetch all slots and filter client-side for now 
      // or assume the user endpoint has been updated. To be safe/fast without changing the user API, 
      // let's fetch ALL active slots from /api/featured and filter by my FID.
      const featRes = await fetch('/api/featured');
      const featData = await featRes.json();
      if (featData.slots) {
        // filter slots where app owner is me
        const mySlots = featData.slots
          .map((app: any, index: number) => ({ app, slotIndex: index })) // map back to slot structure since API returns array of apps
          .filter((item: any) => item.app && item.app.ownerFid === fid);
        setMyFeatured(mySlots);
      }

    } catch (e) {
      console.error("Failed to fetch user data");
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const ctx = await sdk.context;
        if (ctx?.user?.fid) {
          setUser({ fid: ctx.user.fid, username: ctx.user.username, pfpUrl: ctx.user.pfpUrl });
          await refreshData(ctx.user.fid);
        }
      } catch (e) {
        console.error("Profile load error", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  // --- Regular Listing Delete ---
  const initiateDelete = (appId: string) => {
    if (confirmingId === appId) {
      handleDeleteListing(appId);
    } else {
      setConfirmingId(appId);
      setTimeout(() => setConfirmingId(null), 3000);
    }
  };

  const handleDeleteListing = async (appId: string) => {
    if (!user) return;
    setConfirmingId(null);
    setIsDeleting(appId);

    try {
      const { token } = await sdk.quickAuth.getToken();
      if (!token) throw new Error("Failed to authenticate.");

      const res = await fetch('/api/apps/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, fid: user.fid, auth: { token } })
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast("Listing deleted.", 'success');
        await refreshData(user.fid);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(e.message || "Error deleting app.", 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  // --- Featured Slot Delete ---
  const handleRemoveFeature = async () => {
    if (!user || !featuredToDelete) return;
    
    // Strict Check
    if (deleteConfirmationText.toLowerCase() !== "delete featured listing") {
      showToast("Please type the confirmation phrase exactly.", 'error');
      return;
    }

    setIsDeleting(`featured-${featuredToDelete.slotIndex}`);

    try {
      const { token } = await sdk.quickAuth.getToken();
      if (!token) throw new Error("Failed to authenticate.");

      const res = await fetch('/api/featured/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slotIndex: featuredToDelete.slotIndex, 
          fid: user.fid, 
          auth: { token } 
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast("Feature removed.", 'success');
        setFeaturedToDelete(null); // Close modal
        setDeleteConfirmationText("");
        await refreshData(user.fid);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(e.message || "Error removing feature.", 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-gray-400">Loading Profile...</div>;
  if (!user) return <div className="p-8 text-center">Please connect your Farcaster account.</div>;

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 pb-24 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-xl text-xs font-bold animate-fade-in-down transition-all border border-white/20 backdrop-blur-md ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
            {toast.msg}
        </div>
      )}

      {/* Delete Feature Modal */}
      {featuredToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Remove Featured Spot?</h3>
            <p className="text-sm text-gray-500 mb-4">
              This will remove <strong>{featuredToDelete.app.name}</strong> from Slot #{featuredToDelete.slotIndex + 1} immediately. 
              You will <strong>not</strong> be refunded for the remaining time.
            </p>
            
            <p className="text-xs font-bold text-slate-700 mb-2">Type "delete featured listing" to confirm:</p>
            <input 
              type="text" 
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="delete featured listing"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => { setFeaturedToDelete(null); setDeleteConfirmationText(""); }}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRemoveFeature}
                disabled={isDeleting === `featured-${featuredToDelete.slotIndex}` || deleteConfirmationText.toLowerCase() !== "delete featured listing"}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-500/30"
              >
                {isDeleting === `featured-${featuredToDelete.slotIndex}` ? "Removing..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 border-b border-gray-100 mb-6">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={user.pfpUrl || "https://placehold.co/100"} alt="Profile" className="w-16 h-16 rounded-full border-4 border-slate-50 shadow-sm"/>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">@{user.username || "User"}</h1>
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">FID: {user.fid}</span>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="flex p-1 bg-gray-200 rounded-xl mb-6">
          <button onClick={() => setActiveTab('listings')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'listings' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>My Listings</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>History</button>
        </div>

        {activeTab === 'listings' && (
          <div className="space-y-6">
            
            {/* FEATURED SECTION */}
            {myFeatured.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-violet-500 uppercase tracking-wider ml-1">Currently Featured</h3>
                {myFeatured.map(({ app, slotIndex }) => (
                  <div key={`featured-${slotIndex}`} className="bg-gradient-to-br from-violet-50 to-indigo-50 p-4 rounded-xl border border-violet-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-violet-200 text-violet-700 text-[9px] font-bold px-2 py-1 rounded-bl-lg">SLOT #{slotIndex + 1}</div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-lg bg-white shadow-sm object-cover" />
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 truncate">{app.name}</h3>
                        <p className="text-[10px] text-violet-400">Active Promotion</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setFeaturedToDelete({ app, slotIndex, expiresAt: "" })}
                      className="w-full py-2 bg-white text-red-500 border border-red-100 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
                    >
                      Delete Featured Listing
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* REGULAR LISTINGS */}
            <div className="space-y-4">
              {myListings.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">No listings found.</div> : (
                myListings.map(app => (
                  <div key={app.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={app.iconUrl} alt={app.name} className="w-12 h-12 rounded-lg bg-gray-100 object-cover" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 truncate">{app.name || "Unnamed App"}</h3>
                        <p className="text-[10px] text-gray-400 truncate">{app.url}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[9px] bg-green-50 text-green-600 px-1.5 rounded font-bold uppercase">Active</span>
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 rounded font-bold uppercase">{app.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 border-t border-gray-50 pt-3">
                      <div className="flex-1">
                         <OpenAppButton url={app.url} appId={app.id} />
                      </div>
                      <button 
                        onClick={() => initiateDelete(app.id)}
                        disabled={isDeleting === app.id}
                        className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 ${
                          confirmingId === app.id 
                            ? 'bg-red-600 text-white shadow-red-500/30 shadow-lg' 
                            : 'text-red-600 bg-red-50 hover:bg-red-100'
                        }`}
                      >
                        {isDeleting === app.id 
                          ? "Verifying..." 
                          : confirmingId === app.id 
                            ? "Click to Confirm" 
                            : "Delete Listing"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {history.map((tx) => (
              <div key={tx.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2 rounded-lg shrink-0 ${tx.type === 'LISTING' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    <span className="font-bold text-xs">{tx.type === 'LISTING' ? 'L' : 'F'}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{tx.description}</h3>
                    <span className="text-[9px] text-gray-400">{new Date(tx.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right pl-2 shrink-0">
                   <div className="text-sm font-bold text-slate-900">{tx.type === 'LISTING' ? '-$5' : '-$50'}</div>
                   <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${tx.status === 'SUCCESS' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}