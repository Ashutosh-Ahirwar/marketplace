import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SDKProvider from "@/components/SDKProvider";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- DEFINE APP URL ---
// Replace this with your actual deployed Vercel URL
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://marketplace-lovat-zeta.vercel.app/";

const miniAppEmbed = {
  version: "1",
  imageUrl: "https://marketplace-lovat-zeta.vercel.app/hero.png", // Must be 3:2 aspect ratio
  button: {
    title: "Explore Apps",
    action: {
      type: "launch_frame", // "launch_frame" is used for backward compatibility with older clients
      name: "Explore Apps",
      url: "https://marketplace-lovat-zeta.vercel.app",
      splashImageUrl: "https://marketplace-lovat-zeta.vercel.app/splash.png",
      splashBackgroundColor: "#ffffff",
    },
  },
};

export const metadata: Metadata = {
  title: "MiniApp Mart",
  description: "Discover and List Farcaster Mini Apps.",
  // 2. Add OpenGraph tags for better preview on other platforms (like Discord/Twitter)
  openGraph: {
    title: "MiniApp Mart",
    description: "The app store for Farcaster.",
    images: ["https://marketplace-lovat-zeta.vercel.app/hero.png"],
  },
  // 3. Add the Farcaster specific meta tags
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    "fc:frame": JSON.stringify(miniAppEmbed), // Required for legacy support
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-violet-50 text-slate-900`}
      >
        <SDKProvider>
          {/* Main content padding bottom to avoid overlap with Navbar */}
          <div className="pb-20">
            {children}
          </div>
          <Navbar />
        </SDKProvider>
      </body>
    </html>
  );
}