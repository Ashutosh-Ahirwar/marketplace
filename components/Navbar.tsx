'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-violet-100 pb-safe safe-area-inset-bottom z-50 shadow-[0_-4px_20px_rgba(124,58,237,0.05)]">
      <div className="flex justify-around items-center h-16">
        <Link href="/" className="group flex flex-col items-center justify-center w-full h-full">
          <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive('/') ? 'bg-violet-100 text-violet-600' : 'text-gray-400 group-hover:text-violet-500'}`}>
            <svg className="w-6 h-6" fill={isActive('/') ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </div>
          <span className={`text-[10px] font-bold mt-1 transition-colors ${isActive('/') ? 'text-violet-600' : 'text-gray-400'}`}>Discover</span>
        </Link>
        
        <Link href="/search" className="group flex flex-col items-center justify-center w-full h-full">
          <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive('/search') ? 'bg-violet-100 text-violet-600' : 'text-gray-400 group-hover:text-violet-500'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <span className={`text-[10px] font-bold mt-1 transition-colors ${isActive('/search') ? 'text-violet-600' : 'text-gray-400'}`}>Search</span>
        </Link>
        
        {/* List Action - The "Launch" Button */}
        <Link href="/list" className="group flex flex-col items-center justify-center w-full h-full relative">
          <div className="absolute -top-6 bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white p-3.5 rounded-full shadow-lg shadow-violet-500/30 transform transition-transform group-active:scale-95 border-4 border-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </div>
          <span className="text-[10px] font-bold mt-8 text-gray-500 group-hover:text-violet-900 transition-colors">List</span>
        </Link>

        <Link href="/profile" className="group flex flex-col items-center justify-center w-full h-full">
          <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive('/profile') ? 'bg-violet-100 text-violet-600' : 'text-gray-400 group-hover:text-violet-500'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <span className={`text-[10px] font-bold mt-1 transition-colors ${isActive('/profile') ? 'text-violet-600' : 'text-gray-400'}`}>Profile</span>
        </Link>
      </div>
    </nav>
  );
}