'use client'
import { sdk } from '@farcaster/miniapp-sdk'
import { useState, useEffect } from 'react'
// Use relative path for reliability
import { Transaction, MiniApp } from '@/types'
import OpenAppButton from '@/components/OpenAppButton'

export default function ProfilePage() {
  const [user, setUser] = useState<{ fid: number; username?: string; pfpUrl?: string } | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [myListings, setMyListings] = useState<MiniApp[]>([]);
  const [activeTab, setActiveTab] = useState<'listings' | 'history'>('listings');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Custom UI States to replace native alerts/confirms
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // Helper to show custom notifications
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

  const initiateDelete = (appId: string) => {
    if (confirmingId === appId) {
      handleDelete(appId);
    } else {
      setConfirmingId(appId);
      setTimeout(() => setConfirmingId(null), 3000);
    }
  };

  const handleDelete = async (appId: string) => {
    if (!user) return;
    
    setConfirmingId(null);
    setIsDeleting(appId);

    try {
      const nonce = `delete-${appId}-${Date.now()}`;
      
      // FIX: Add Timeout to prevent "Stuck" state if SDK hangs
      // This waits for EITHER the sign-in result OR a 15-second timer
      const signPromise = sdk.actions.signIn({ nonce });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Signature request timed out")), 15000)
      );

      // @ts-ignore - Promise.race types can be tricky with SDKs
      const signResult: any = await Promise.race([signPromise, timeoutPromise]);

      if (!signResult.signature || !signResult.message) {
        throw new Error("Signature failed or was rejected");
      }

      // 3. Send Authenticated Request
      const res = await fetch('/api/apps/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appId, 
          fid: user.fid,
          auth: {
            signature: signResult.signature,
            message: signResult.message,
            nonce: nonce 
          }
        })
      });
      
      const data = await res.json();

      if (res.ok) {
        showToast("Listing deleted successfully.", 'success');
        await refreshData(user.fid);
      } else {
        showToast(`Failed to delete: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Error deleting app.", 'error');
    } finally {
      // CRITICAL: Always reset loading state
      setIsDeleting(null);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-gray-400">Loading Profile...</div>;
  if (!user) return <div className="p-8 text-center">Please connect your Farcaster account.</div>;

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 pb-24 relative">
      {/* Toast Notification UI */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-xl text-xs font-bold animate-fade-in-down transition-all border border-white/20 backdrop-blur-md ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
            {toast.msg}
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