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

export const metadata: Metadata = {
  title: "MiniApp Mart",
  description: "Discover, List, and Trade Farcaster Mini Apps.",
  openGraph: {
    title: "MiniApp Mart",
    description: "The decentralized app store for Farcaster.",
    images: ["https://placehold.co/600x400.png?text=MiniApp+Mart"], 
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: "https://placehold.co/600x400.png?text=MiniApp+Mart",
      button: {
        title: "Explore Apps",
        action: {
          type: "launch_frame",
          name: "MiniApp Mart",
          url: "https://miniapp-mart.vercel.app", // Replace with your domain
          splashImageUrl: "https://placehold.co/200.png",
          splashBackgroundColor: "#f8fafc"
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
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