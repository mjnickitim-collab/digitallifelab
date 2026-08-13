export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string; // Markdown or HTML
  coverImage: string;
  imageCaption?: string;
  category: string;
  tags: string[];
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  livingProblem?: string;
  digitalTool?: string;
  testEnvironment?: string;
  toc?: string[];
  faq?: Array<{ question: string; answer: string }>;
  verificationChecklist?: string[];
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
  readTimeMinutes: number;
  featured?: boolean;
  published: boolean;
  views: number;
  likes: number;
}

export interface PostComment {
  id: string;
  postId: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  createdAt: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

export interface SecretKeysConfig {
  geminiApiKey: string;
  unsplashAccessKey: string;
  resendApiKey: string;
  resendFromEmail: string;
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
  adminPassword: string;
}

export type AdPlacementLocation =
  | 'home_top'
  | 'home_middle'
  | 'home_bottom'
  | 'post_top'
  | 'post_middle'
  | 'post_bottom'
  | 'sidebar';

export interface AdSlotConfig {
  id: AdPlacementLocation;
  name: string;
  description: string;
  enabled: boolean;
  type: 'adsense' | 'banner';
  adsenseCode?: string;
  bannerImageUrl?: string;
  bannerTargetUrl?: string;
  bannerAltText?: string;
  bannerOpenNewTab?: boolean;
}

export interface AdsConfig {
  slots: Record<AdPlacementLocation, AdSlotConfig>;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  status: 'active' | 'unsubscribed';
  source?: string;
}

export interface NewsletterIssue {
  id: string;
  title: string;
  content: string;
  postId?: string;
  postTitle?: string;
  sentAt: string;
  recipientCount: number;
  status: 'sent' | 'draft';
}

export interface StaticPageData {
  title: string;
  subtitle?: string;
  content: string;
  updatedAt?: string;
}

export interface StaticPagesConfig {
  about: StaticPageData;
  terms: StaticPageData;
  privacy: StaticPageData;
}

export interface SiteMeta {
  title: string;
  description: string;
  author: string;
  url: string;
}
