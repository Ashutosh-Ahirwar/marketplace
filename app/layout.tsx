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

// --- CONFIGURATION FROM MANIFEST ---
const APP_URL = "https://marketplace-lovat-zeta.vercel.app";

const miniAppEmbed = {
  version: "1",
  imageUrl: `${APP_URL}/icon.png`, // Matches manifest "imageUrl"
  button: {
    title: "Explore Apps", // Matches manifest "buttonTitle"
    action: {
      type: "launch_miniapp",
      name: "MiniApp Mart", // Matches manifest "name"
      url: APP_URL, // Matches manifest "homeUrl"
      splashImageUrl: `${APP_URL}/splash.png`, // Matches manifest "splashImageUrl"
      splashBackgroundColor: "#ffffff", // Matches manifest "splashBackgroundColor"
    }
  }
};

export const metadata: Metadata = {
  title: "MiniApp Mart",
  description: "Discover and List MiniApps", // Matches manifest "description"
  openGraph: {
    title: "MiniApp Mart",
    description: "Discover and List MiniApps",
    images: [`${APP_URL}/hero.png`], // Matches manifest "heroImageUrl" for better social sharing
  },
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    "fc:frame": JSON.stringify({
      ...miniAppEmbed,
      button: {
        ...miniAppEmbed.button,
        action: {
          ...miniAppEmbed.button.action,
          type: "launch_frame" // Legacy compatibility
        }
      }
    }),
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