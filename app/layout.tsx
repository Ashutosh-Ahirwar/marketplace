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
// Matches 'homeUrl' in JSON
const APP_URL = "https://marketplace-lovat-zeta.vercel.app";

const miniAppEmbed = {
  version: "1",
  // Per JSON 'imageUrl' -> "hero.png" (1200x800 is perfect 3:2 ratio)
  imageUrl: `${APP_URL}/hero.png`,
  button: {
    // Per JSON 'buttonTitle' -> "Explore Apps"
    title: "Explore Apps",
    action: {
      type: "launch_miniapp",
      // Per JSON 'name' -> "MiniApp Mart"
      name: "MiniApp Mart",
      // Per JSON 'homeUrl'
      url: APP_URL,
      // Per JSON 'splashImageUrl' -> "splash.png"
      splashImageUrl: `${APP_URL}/splash.png`,
      // Per JSON 'splashBackgroundColor' -> "#ffffff"
      splashBackgroundColor: "#ffffff",
    },
  },
};

export const metadata: Metadata = {
  // Per JSON 'ogTitle'
  title: "MiniApp Mart",
  // Per JSON 'ogDescription'
  description: "Browse launch and share MiniApps from the Farcaster community all in one hub",
  openGraph: {
    title: "MiniApp Mart",
    description: "Browse launch and share MiniApps from the Farcaster community all in one hub",
    // Adding the hero image to standard OG tags as well for better compatibility
    images: [`${APP_URL}/hero.png`], 
  },
  other: {
    // "fc:frame" is used for backward compatibility
    "fc:frame": JSON.stringify(miniAppEmbed),
    // "fc:miniapp" is the modern standard
    "fc:miniapp": JSON.stringify(miniAppEmbed),
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