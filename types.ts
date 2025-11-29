export type AppCategory = 
  | 'games' | 'social' | 'finance' | 'utility' | 'productivity' 
  | 'health-fitness' | 'news-media' | 'music' | 'shopping' 
  | 'education' | 'developer-tools' | 'entertainment' | 'art-creativity';

export const APP_CATEGORIES: AppCategory[] = [
  'games', 'social', 'finance', 'utility', 'productivity', 
  'health-fitness', 'news-media', 'music', 'shopping', 
  'education', 'developer-tools', 'entertainment', 'art-creativity'
];

export interface Transaction {
  id: string;
  txHash: string;
  type: 'LISTING' | 'FEATURED';
  amount: string;
  timestamp: number;
  description: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface MiniApp {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  url: string; 
  category: AppCategory;
  authorUsername: string; // The person who listed it
  ownerFid: number;       // FID of the person who listed it
  isVerified: boolean;
  createdAt: number;
  // uniqueViews: number; // REMOVED
  clicks: number;
  trendingScore: number;
}