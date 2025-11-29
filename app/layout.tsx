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
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://your-miniapp-url.vercel.app";

export const metadata: Metadata = {
  title: "MiniApp Mart",
  description: "Discover and List Farcaster Mini Apps.",
  openGraph: {
    title: "MiniApp Mart",
    description: "The app store for Farcaster.",
    images: [`${APP_URL}/icon.png`], // Ensure this image exists in public/ folder
  },
  other: {
    // MODERN MINI APP EMBED
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: `${APP_URL}/hero.png`, // 3:2 Aspect Ratio Image
      button: {
        title: "Launch 🚀",
        action: {
          type: "launch_miniapp",
          name: "MiniApp Mart",
          url: APP_URL,
          splashImageUrl: `${APP_URL}/rocket-icon.png`,
          splashBackgroundColor: "#f5f3ff" // Matches your Violet-50 background
        }
      }
    }),
    // BACKWARD COMPATIBILITY
    "fc:frame": JSON.stringify({
      version: "1",
      imageUrl: `${APP_URL}/hero.png`,
      button: {
        title: "Launch 🚀",
        action: {
          type: "launch_frame",
          name: "MiniApp Mart",
          url: APP_URL,
          splashImageUrl: `${APP_URL}/rocket-icon.png`,
          splashBackgroundColor: "#f5f3ff"
        }
      }
    })
  }
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