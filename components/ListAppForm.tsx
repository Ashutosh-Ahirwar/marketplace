'use client'
import { sdk } from '@farcaster/miniapp-sdk'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' 
import { APP_CATEGORIES } from '../types'
import { MARKETPLACE_CONFIG } from '../lib/config'

// Hardcoded for sharing deep links (matches layout.tsx)
const MARKETPLACE_URL = "https://marketplace-lovat-zeta.vercel.app";

export default function ListAppForm() {
  const router = useRouter(); 
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>(""); 
  
  const [user, setUser] = useState<{ fid: number; username: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Form State
  const [iconUrl, setIconUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [appUrl, setAppUrl] = useState(''); 
  const [descCount, setDescCount] = useState(0);

  // Validation State
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isUrlVerified, setIsUrlVerified] = useState(false);
  const [verifyingUrl, setVerifyingUrl] = useState(false);

  // Recovery State
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // Success & Share State
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ name: string, url: string } | null>(null);

  const DESC_LIMIT = 100;
  const NAME_LIMIT = 30;
  const REQUIRED_PREFIX = "https://farcaster.xyz/miniapps/";

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

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

  useEffect(() => {
    if (!appUrl) {
        setUrlError(null);
        return;
    }
    if (!appUrl.startsWith(REQUIRED_PREFIX)) {
        setUrlError("URL must start with 'https://farcaster.xyz/miniapps/'");
        setIsUrlVerified(false);
    } else {
        setUrlError(null);
        if (isUrlVerified) setIsUrlVerified(false);
    }
  }, [appUrl]);

  const handleConnect = async () => {
    try {
      const ctx = await sdk.context;
      if (ctx?.user?.username) {
        setUser({ fid: ctx.user.fid, username: ctx.user.username });
        setIsConnected(true);
      } else {
        await sdk.actions.signIn({ nonce: `connect-${Date.now()}` });
      }
    } catch (e) {
      showToast("Connection failed.", 'error');
    }
  };

  const checkUrlAvailability = async () => {
    if (urlError || !appUrl) return;
    setVerifyingUrl(true);
    try {
        const res = await fetch('/api/apps/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: appUrl })
        });
        const data = await res.json();
        
        if (data.exists) {
            setUrlError(`App already listed: ${data.app.name}`);
            setIsUrlVerified(false);
        } else {
            setIsUrlVerified(true);
        }
    } catch (e) {
        showToast("Failed to verify URL.", 'error');
    } finally {
        setVerifyingUrl(false);
    }
  };

  // UPDATED: Share logic now links to the Marketplace Search for the app
  const handleShare = async () => {
    if (!successData) return;
    
    // Construct deep link to finding this app in the mart
    const martLink = `${MARKETPLACE_URL}/search?q=${encodeURIComponent(successData.name)}`;

    try {
      await sdk.actions.composeCast({
        text: `I just listed ${successData.name} on MiniApp Mart! 🚀\n\nCheck it out:`,
        embeds: [martLink] 
      });
    } catch (error) {
      console.error("Share failed:", error);
      showToast("Could not open share composer", "error");
    }
  };

  const processListing = async (txHash: string, formData: FormData) => {
    try {
      setStatusMessage("Authenticating..."); 
      
      if (!user) throw new Error("User context missing");

      const tokenResult = await sdk.quickAuth.getToken();
      
      if (!tokenResult || !tokenResult.token) {
        throw new Error("Failed to authenticate. Please try again.");
      }

      setStatusMessage("Verifying Transaction...");

      const name = formData.get('name') as string;
      const url = formData.get('url') as string;

      const appData = {
        name,
        description: formData.get('description'),
        url,
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
          auth: { token: tokenResult.token }
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setLoading(false);
      setPendingTxHash(null);
      setSuccessData({ name, url });
      setIsSuccess(true);
      showToast("App Listed Successfully!", 'success');
      
    } catch (e: any) {
      console.error("Listing failed", e);
      
      const isTxFailure = e.message?.toLowerCase().includes("transaction") || e.message?.toLowerCase().includes("payment");
      
      if (isTxFailure) {
          setPendingTxHash(null); 
          setErrorState(`Verification failed: ${e.message}. Please try again.`);
      } else {
          setPendingTxHash(txHash); 
          setErrorState(`Listing failed: ${e.message}. Payment was successful. Please click 'Retry Submission'.`);
      }
      setLoading(false);
    } 
  };

  const handleListApp = async (formData: FormData) => {
    setErrorState(null);
    setLoading(true);
    setStatusMessage("Initializing...");

    try {
      const url = formData.get('url') as string;
      
      if (!url.startsWith(REQUIRED_PREFIX)) {
        throw new Error("Invalid Link. Please check the URL format.");
      }

      if (!isUrlVerified) {
          const res = await fetch('/api/apps/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          const data = await res.json();
          if (data.exists) throw new Error("This app is already listed.");
      }

      if (!user) {
        throw new Error("Please connect wallet.");
      }

      if (pendingTxHash) {
        setStatusMessage("Retrying submission...");
        await processListing(pendingTxHash, formData);
        return; 
      }

      setStatusMessage("Please confirm payment in wallet..."); 
      const result = await sdk.actions.sendToken({
        token: MARKETPLACE_CONFIG.tokens.baseUsdc,
        amount: MARKETPLACE_CONFIG.prices.listingUsdc,
        recipientAddress: MARKETPLACE_CONFIG.recipientAddress, 
      });

      if (result.success) {
        setStatusMessage("Payment sent! Verifying...");
        await processListing(result.send.transaction, formData);
      } else {
        setLoading(false);
        if (result.reason === 'rejected_by_user') {
           console.log("User cancelled payment");
           setErrorState(null); 
        } else {
           throw new Error(`Transaction failed: ${result.error?.message || "Unknown error"}`);
        }
      }

    } catch (e: any) {
      console.error("Transaction/Listing Exception:", e);
      setLoading(false);
      if (!e.message?.toLowerCase().includes("rejected")) {
        setErrorState(e.message || "Transaction failed. Please try again.");
      }
    }
  };

  // --- RENDER SUCCESS VIEW ---
  if (isSuccess && successData) {
    return (
      <div className="p-8 border border-violet-100 rounded-3xl bg-white shadow-sm flex flex-col items-center text-center gap-6 animate-fade-in">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-2 shadow-sm border border-green-100">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <div>
          <h3 className="font-extrabold text-2xl text-violet-950 mb-2">Listing Created!</h3>
          <p className="text-sm text-gray-500">
            <strong>{successData.name}</strong> is now live on the marketplace.
          </p>
        </div>

        <div className="w-full space-y-3 mt-2">
          <button 
            onClick={handleShare}
            className="w-full py-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:to-indigo-700 shadow-lg shadow-violet-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
            Share Listing
          </button>
          
          <button 
            onClick={() => router.push('/profile')}
            className="w-full py-4 rounded-xl font-bold text-violet-600 text-sm bg-violet-50 hover:bg-violet-100 transition-colors"
          >
            View My Profile
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER FORM ---
  return (
    <div className="p-6 border border-violet-100 rounded-3xl bg-white shadow-sm flex flex-col gap-5 relative">
      {toast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-xs font-bold animate-fade-in-down transition-all w-max ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
            {toast.msg}
        </div>
      )}

      <div>
        <h3 className="font-bold text-xl text-violet-950">List App ({MARKETPLACE_CONFIG.labels.listingPrice})</h3>
        <p className="text-xs text-violet-400">Fee per listing • Base USDC</p>
      </div>
      
      {errorState && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-100">
          ⚠️ {errorState}
        </div>
      )}

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

        <input 
          name="name" 
          placeholder="App Name" 
          required 
          maxLength={NAME_LIMIT}
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          className="p-3.5 bg-violet-50/50 border border-violet-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-violet-900 placeholder:text-violet-300" 
        />
        
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
        
        {/* --- APP URL WITH LIVE VALIDATION --- */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
                <input 
                    name="url" 
                    type="url" 
                    placeholder="https://farcaster.xyz/miniapps/..." 
                    required 
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    className={`p-3.5 pl-9 w-full border rounded-xl text-sm outline-none focus:ring-2 transition-all text-violet-900 placeholder:text-violet-300 ${
                        urlError 
                            ? 'bg-red-50 border-red-200 focus:ring-red-500/20 focus:border-red-500' 
                            : isUrlVerified 
                                ? 'bg-green-50 border-green-200 focus:ring-green-500/20 focus:border-green-500' 
                                : 'bg-violet-50/50 border-violet-100 focus:ring-violet-500/20 focus:border-violet-500'
                    }`} 
                />
                <svg className={`w-4 h-4 absolute left-3 top-3.5 transition-colors ${urlError ? 'text-red-400' : isUrlVerified ? 'text-green-500' : 'text-violet-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </div>
            <button 
                type="button"
                onClick={checkUrlAvailability}
                disabled={!!urlError || !appUrl || verifyingUrl || isUrlVerified}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isUrlVerified 
                        ? 'bg-green-100 text-green-700 cursor-default' 
                        : urlError
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                }`}
            >
                {verifyingUrl ? "Checking..." : isUrlVerified ? "Available" : "Verify"}
            </button>
          </div>
          
          {urlError && (
            <p className="text-[10px] text-red-500 ml-1 mt-1 font-medium animate-pulse">
                {urlError}
            </p>
          )}
          {!urlError && !isUrlVerified && (
             <p className="text-[10px] text-violet-400 ml-1 mt-1">
                Tip: Open your app, click "..." then "Copy link to mini app"
            </p>
          )}
        </div>
        
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
          // UPDATED: Strict Validation Checks
          disabled={
            loading || 
            !!urlError || 
            !isUrlVerified || 
            !appName.trim() || 
            !iconUrl.trim() || 
            descCount === 0
          }
          type="submit" 
          className={`p-4 rounded-xl font-bold text-white text-sm shadow-lg shadow-violet-600/30 active:scale-95 transition-all flex justify-center items-center gap-2 ${
            pendingTxHash ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
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