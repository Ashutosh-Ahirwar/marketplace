'use client'
import { sdk } from '@farcaster/miniapp-sdk'
import { useState, useEffect } from 'react'
import { Transaction, MiniApp } from '@/types'
import OpenAppButton from '@/components/OpenAppButton'

export default function ProfilePage() {
  const [user, setUser] = useState<{ fid: number; username?: string; pfpUrl?: string } | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [myListings, setMyListings] = useState<MiniApp[]>([]);
  const [activeTab, setActiveTab] = useState<'listings' | 'history'>('listings');
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async (fid: number) => {
    try {
      const res = await fetch(`/api/user/${fid}`);
      const data = await res.json();
      if (data.listings) setMyListings(data.listings);
      if (data.transactions) setHistory(data.transactions);
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

  const handleDelete = async (appId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this listing? This cannot be undone.")) return;

    try {
      const res = await fetch('/api/apps/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, fid: user.fid })
      });
      
      if (res.ok) {
        alert("Listing deleted.");
        refreshData(user.fid);
      } else {
        alert("Failed to delete.");
      }
    } catch (e) {
      alert("Error deleting app.");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-gray-400">Loading Profile...</div>;
  if (!user) return <div className="p-8 text-center">Please connect your Farcaster account.</div>;

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 pb-24">
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
                      onClick={() => handleDelete(app.id)}
                      className="flex-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 font-bold py-2.5 rounded-xl transition-colors"
                    >
                      Delete Listing
                    </button>
                  </div>
                </div>
              ))
            )}
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
                    <a 
                      href={`https://basescan.org/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noreferrer" 
                      className="text-[10px] text-blue-500 hover:underline font-mono block truncate"
                    >
                      {tx.txHash}
                    </a>
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