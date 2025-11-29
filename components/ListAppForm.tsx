'use client'
import { sdk } from '@farcaster/miniapp-sdk'
import { useState, useEffect } from 'react'
import { APP_CATEGORIES } from '@/types'
import { MARKETPLACE_CONFIG } from '@/lib/config'

export default function ListAppForm() {
  const [loading, setLoading] = useState(false);
  // NEW: Granular status to show user exactly what is happening
  const [statusMessage, setStatusMessage] = useState<string>(""); 
  
  const [user, setUser] = useState<{ fid: number; username: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Form State
  const [iconUrl, setIconUrl] = useState('');
  const [appName, setAppName] = useState('');
  
  // Input Constraints
  const [descCount, setDescCount] = useState(0);

  // Recovery State
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);

  const DESC_LIMIT = 100;
  const NAME_LIMIT = 30;

  useEffect(() => {
    const load = async () => {
      try {
        const ctx = await sdk.context;
        if (ctx?.user?.username && ctx?.user?.fid) {
          setUser({ fid: ctx.user.fid, username: ctx.user.username });
          setIsConnected(true);
        }
      } catch (e) { }
    };
    load();
  }, []);

  const handleConnect = async () => {
    try {
      const ctx = await sdk.context;
      if (ctx?.user?.username) {
        setUser({ fid: ctx.user.fid, username: ctx.user.username });
        setIsConnected(true);
      }
    } catch (e) {
      alert("Connection failed.");
    }
  };

  const processListing = async (txHash: string, formData: FormData) => {
    try {
      setStatusMessage("Verifying listing..."); // Feedback step 2
      
      if (!user) throw new Error("User context missing");

      // 1. GENERATE SIGNATURE
      const tokenPromise = sdk.quickAuth.getToken();
      const timeoutPromise = new Promise<{token: string}>((_, reject) => 
        setTimeout(() => reject(new Error("Auth request timed out")), 10000)
      );

      const { token } = await Promise.race([tokenPromise, timeoutPromise]);
      
      if (!token) {
        throw new Error("Failed to authenticate. Please try again.");
      }

      const appData = {
        name: formData.get('name'),
        description: formData.get('description'),
        url: formData.get('url'),
        iconUrl: formData.get('iconUrl'),
        category: formData.get('category'),
        isVerified: true
      };

      const res = await fetch('/api/apps/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          txHash, 
          appData, 
          user,
          auth: { token }
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setStatusMessage("Success!"); // Feedback step 3
      alert("Success! App Listed.");
      window.location.href = '/profile'; 
      
    } catch (e: any) {
      console.error("Listing failed", e);
      setPendingTxHash(txHash); 
      setErrorState(`Listing failed: ${e.message}. Payment was successful. Please click 'Retry Submission'.`);
    } finally {
        setLoading(false); 
        setStatusMessage("");
    }
  };

  const handleListApp = async (formData: FormData) => {
    setErrorState(null);
    setLoading(true);
    setStatusMessage("Initializing...");

    const url = formData.get('url') as string;
    
    if (!url.startsWith("https://farcaster.xyz/miniapps/")) {
      setErrorState("Invalid Link. Please use the official Farcaster Universal Link.");
      setLoading(false);
      setStatusMessage("");
      return;
    }

    if (!user) {
      setErrorState("Please connect wallet.");
      setLoading(false);
      setStatusMessage("");
      return;
    }

    try {
      if (pendingTxHash) {
        setStatusMessage("Retrying submission...");
        await processListing(pendingTxHash, formData);
        return;
      }

      setStatusMessage("Please confirm payment in wallet..."); // Feedback step 1

      // 1. Request Payment
      const result = await sdk.actions.sendToken({
        token: MARKETPLACE_CONFIG.tokens.baseUsdc,
        amount: MARKETPLACE_CONFIG.prices.listingUsdc,
        recipientAddress: MARKETPLACE_CONFIG.recipientAddress, 
      });

      // 2. Handle Result
      if (result.success) {
        setStatusMessage("Payment sent! Finalizing...");
        await processListing(result.send.transaction, formData);
      } else {
          setLoading(false);
          setStatusMessage("");
          if (result.reason === 'rejected_by_user') {
             console.log("User cancelled payment");
          } else {
             setErrorState(`Transaction failed: ${result.error?.message || "Unknown error"}`);
          }
      }
    } catch (e: any) {
      console.error("Transaction Exception:", e);
      setLoading(false);
      setStatusMessage("");
      if (!e.message?.toLowerCase().includes("rejected")) {
        setErrorState("Transaction failed. Please try again.");
      }
    }
  };

  return (
    <div className="p-6 border border-violet-100 rounded-3xl bg-white shadow-sm flex flex-col gap-5">
      <div>
        <h3 className="font-bold text-xl text-violet-950">List App ({MARKETPLACE_CONFIG.labels.listingPrice})</h3>
        <p className="text-xs text-violet-400">Fee per listing • Base USDC</p>
      </div>
      
      {errorState && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-100">
          ⚠️ {errorState}
        </div>
      )}

      {/* Account Connection */}
      <div className={`p-4 rounded-2xl border flex justify-between items-center transition-colors ${isConnected ? 'bg-violet-50 border-violet-100' : 'bg-gray-50 border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isConnected ? 'bg-violet-200 text-violet-700' : 'bg-gray-200 text-gray-500'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wide">Listing As</p>
            <p className="text-sm font-bold text-violet-900">{user?.username ? `@${user.username}` : "Guest"}</p>
          </div>
        </div>
        {!isConnected ? (
          <button onClick={handleConnect} type="button" className="text-xs bg-violet-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
            Connect
          </button>
        ) : (
          <span className="text-xs text-violet-600 font-bold bg-violet-100 px-2 py-1 rounded">Connected</span>
        )}
      </div>

      <form action={handleListApp} className={`flex flex-col gap-4 ${!isConnected ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {pendingTxHash && (
          <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs border border-amber-200">
            <strong>Payment Detected!</strong> Hash: {pendingTxHash.slice(0, 6)}... Click submit to retry.
          </div>
        )}

        {/* --- APP NAME --- */}
        <input 
          name="name" 
          placeholder="App Name" 
          required 
          maxLength={NAME_LIMIT}
          onChange={(e) => setAppName(e.target.value)}
          className="p-3.5 bg-violet-50/50 border border-violet-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-violet-900 placeholder:text-violet-300" 
        />
        
        {/* --- DESCRIPTION --- */}
        <div className="relative">
          <textarea 
            name="description" 
            placeholder="Short Description" 
            required 
            maxLength={DESC_LIMIT}
            onChange={(e) => setDescCount(e.target.value.length)}
            className="p-3.5 bg-violet-50/50 border border-violet-100 rounded-xl text-sm h-24 resize-none outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all w-full text-violet-900 placeholder:text-violet-300" 
          />
          <div className="absolute bottom-2 right-2 text-[10px] text-violet-300 font-mono">{descCount}/{DESC_LIMIT}</div>
        </div>
        
        {/* --- APP URL --- */}
        <div className="relative">
          <input 
            name="url" 
            type="url" 
            placeholder="https://farcaster.xyz/miniapps/..." 
            required 
            className="p-3.5 pl-9 bg-violet-50/50 border border-violet-100 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-violet-900 placeholder:text-violet-300" 
          />
          <svg className="w-4 h-4 text-violet-300 absolute left-3 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </div>
        <p className="text-[10px] text-violet-400 ml-1 -mt-2">
          Tip: Open your app, click "..." then "Copy link to mini app"
        </p>
        
        {/* --- ICON URL & PREVIEW --- */}
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <input 
              name="iconUrl" 
              type="url" 
              placeholder="Icon Image URL" 
              required 
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              className="p-3.5 bg-violet-50/50 border border-violet-100 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-violet-900 placeholder:text-violet-300" 
            />
          </div>
          {/* PREVIEW BOX */}
          <div className="w-12 h-12 rounded-xl border border-violet-100 bg-violet-50/50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            {iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={iconUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=?'; }} 
              />
            ) : (
              <span className="text-[9px] text-violet-300 text-center leading-tight">Icon<br/>Preview</span>
            )}
          </div>
        </div>

        <select name="category" className="p-3.5 bg-violet-50/50 border border-violet-100 rounded-xl text-sm capitalize outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-violet-900">
          {APP_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('-', ' ')}</option>)}
        </select>

        <button 
          disabled={loading} 
          type="submit" 
          className={`p-4 rounded-xl font-bold text-white text-sm shadow-lg shadow-violet-600/30 active:scale-95 transition-all flex justify-center items-center gap-2 ${
            pendingTxHash ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:to-indigo-700'
          }`}
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading 
            ? (statusMessage || 'Processing...') 
            : pendingTxHash 
              ? 'Retry Submission' 
              : `Pay ${MARKETPLACE_CONFIG.labels.listingPrice} & Submit`
          }
        </button>
      </form>
    </div>
  )
}