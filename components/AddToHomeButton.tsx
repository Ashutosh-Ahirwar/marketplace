'use client';
import { sdk } from "@farcaster/miniapp-sdk";
import { useState, useEffect } from "react";

export default function AddToHomeButton() {
  // FIX: Default to false (Visible) so it shows up during development/browser testing
  const [isAdded, setIsAdded] = useState(false); 

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const ctx = await sdk.context;
        // Only hide if the client explicitly confirms it's added
        if (ctx?.client?.added) {
          setIsAdded(true);
        }
      } catch (e) {
        // If SDK fails or is not present, we keep the button visible
        console.log("Not in Farcaster client, showing button for dev");
      }
    };
    checkStatus();
  }, []);

  const handleAdd = async () => {
    try {
      await sdk.actions.addMiniApp();
      setIsAdded(true); // Hide immediately after clicking
    } catch (e) {
      console.error("Failed to add app", e);
    }
  };

  if (isAdded) return null;

  return (
    <button 
      onClick={handleAdd}
      className="flex items-center gap-2 bg-violet-100 text-violet-700 px-3 py-1.5 rounded-full text-[10px] font-bold hover:bg-violet-200 transition-colors animate-fade-in"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      Bookmark
    </button>
  );
}