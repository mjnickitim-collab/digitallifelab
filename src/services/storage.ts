import { BlogPost, PostComment, SecretKeysConfig, NewsletterSubscriber, NewsletterIssue, AdsConfig, AdSlotConfig, StaticPageData, StaticPagesConfig } from '../types';
import { INITIAL_POSTS } from '../data/samplePosts';
import { sanitizeBlogPostData } from '../utils/textSanitizer';
import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from '../lib/firebase';

const POSTS_KEY = 'modablog_posts_v1';
const COMMENTS_KEY = 'modablog_comments_v1';
const SECRETS_KEY = 'modablog_secrets_v1';
const ADMIN_AUTH_KEY = 'modablog_admin_auth_v1';
const SUBSCRIBERS_KEY = 'modablog_subscribers_v1';
const NEWSLETTERS_KEY = 'modablog_newsletters_v1';
const ADS_KEY = 'modablog_ads_v1';

export const DEFAULT_SECRETS: SecretKeysConfig = {
  geminiApiKey: '',
  unsplashAccessKey: '',
  resendApiKey: 're_g2kTk2hu_Kc9PNXqnKgPWJkypvPkTwJoB',
  resendFromEmail: 'onboarding@resend.dev',
  firebaseApiKey: '',
  firebaseAuthDomain: '',
  firebaseProjectId: '',
  firebaseStorageBucket: '',
  firebaseMessagingSenderId: '',
  firebaseAppId: '',
  adminPassword: 'admin1234',
};

export const DEFAULT_ADS_CONFIG: AdsConfig = {
  slots: {
    home_top: {
      id: 'home_top',
      name: '메인 화면 상단 배너',
      description: '블로그 메인 페이지 상단(헤더 바로 아래)에 노출되는 대형 배너 광고',
      enabled: false,
      type: 'adsense',
      adsenseCode: '<ins class="adsbygoogle"\n     style="display:block"\n     data-ad-client="ca-pub-1234567890123456"\n     data-ad-slot="1234567890"\n     data-ad-format="auto"\n     data-full-width-responsive="true"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>',
      bannerImageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
      bannerTargetUrl: 'https://digitallifelab.com',
      bannerAltText: '디지털생활연구소 정보 배너',
      bannerOpenNewTab: true,
    },
    home_middle: {
      id: 'home_middle',
      name: '메인 화면 중간 배너',
      description: '추천 칼럼 아래 및 포스트 카드 사이에 노출되는 가로 배너 광고',
      enabled: false,
      type: 'banner',
      adsenseCode: '',
      bannerImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      bannerTargetUrl: 'https://digitallifelab.com',
      bannerAltText: '스마트 디지털 라이프 솔루션',
      bannerOpenNewTab: true,
    },
    home_bottom: {
      id: 'home_bottom',
      name: '메인 화면 하단 배너',
      description: '메인 페이지 최하단(푸터 직전) 영역 배너 광고',
      enabled: false,
      type: 'adsense',
      adsenseCode: '',
      bannerImageUrl: '',
      bannerTargetUrl: '',
      bannerAltText: '',
      bannerOpenNewTab: true,
    },
    post_top: {
      id: 'post_top',
      name: '글 내용 상단 배너',
      description: '포스트 상세페이지 제목 및 메타정보 바로 아래에 노출되는 상단 배너',
      enabled: false,
      type: 'banner',
      adsenseCode: '',
      bannerImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      bannerTargetUrl: 'https://digitallifelab.com',
      bannerAltText: 'AI 생산성 도구 가이드북',
      bannerOpenNewTab: true,
    },
    post_middle: {
      id: 'post_middle',
      name: '글 내용 중간 배너',
      description: '포스트 본문 중간(요약 또는 목차 아래)에 삽입되는 본문 배너',
      enabled: false,
      type: 'adsense',
      adsenseCode: '',
      bannerImageUrl: '',
      bannerTargetUrl: '',
      bannerAltText: '',
      bannerOpenNewTab: true,
    },
    post_bottom: {
      id: 'post_bottom',
      name: '글 내용 하단 배너',
      description: '포스트 본문 최하단(댓글 구역 바로 위)에 삽입되는 하단 배너',
      enabled: false,
      type: 'banner',
      adsenseCode: '',
      bannerImageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
      bannerTargetUrl: 'https://digitallifelab.com',
      bannerAltText: '디지털생활연구소 뉴스레터 구독',
      bannerOpenNewTab: true,
    },
    sidebar: {
      id: 'sidebar',
      name: '우측 사이드바 배너',
      description: '데스크톱 메인 및 포스트 우측 사이드바 영역 카드 배너',
      enabled: false,
      type: 'banner',
      adsenseCode: '',
      bannerImageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
      bannerTargetUrl: 'https://digitallifelab.com',
      bannerAltText: '스마트 도구 모음집',
      bannerOpenNewTab: true,
    },
  },
};

// Sanitizes objects for Firestore by recursively removing undefined fields
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Helper: Generate Sitemap XML from posts array
export function generateSitemapXmlFromPosts(posts: BlogPost[], baseUrl: string = window.location.origin): string {
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/about', priority: '0.8', changefreq: 'monthly' },
    { url: '/terms', priority: '0.5', changefreq: 'yearly' },
    { url: '/privacy', priority: '0.5', changefreq: 'yearly' },
  ];

  const now = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  staticPages.forEach((page) => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  if (Array.isArray(posts)) {
    posts.forEach((post) => {
      if (post.published !== false) {
        const slug = post.slug || post.id;
        const lastmod = post.updatedAt || post.publishedAt || now;
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/post/${encodeURIComponent(slug)}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    });
  }

  xml += `</urlset>`;
  return xml;
}

// Helper: Save Sitemap to Firestore & Server API
export async function syncSitemapToFirestore(posts: BlogPost[]) {
  try {
    const xml = generateSitemapXmlFromPosts(posts);
    const sitemapRef = doc(db, 'sitemaps', 'latest');
    await setDoc(sitemapRef, sanitizeForFirestore({
      xml,
      updatedAt: new Date().toISOString(),
      postCount: posts.length,
    }), { merge: true });

    // Send to backend endpoint
    await fetch('/api/update-sitemap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts }),
    }).catch((e) => console.log('Server sitemap cache update note:', e));
  } catch (err) {
    console.error('Error syncing sitemap to Firestore:', err);
  }
}

// --- Secrets Management ---
export function getSecretKeys(): SecretKeysConfig {
  try {
    const saved = localStorage.getItem(SECRETS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SECRETS,
        ...parsed,
        resendApiKey: parsed.resendApiKey || DEFAULT_SECRETS.resendApiKey,
      };
    }
  } catch (e) {
    console.error('Failed to load secrets:', e);
  }
  return DEFAULT_SECRETS;
}

export function saveSecretKeys(keys: Partial<SecretKeysConfig>): SecretKeysConfig {
  const current = getSecretKeys();
  const updated = { ...current, ...keys };
  try {
    localStorage.setItem(SECRETS_KEY, JSON.stringify(updated));
    // Persist to Firestore settings collection
    setDoc(doc(db, 'settings', 'secrets'), sanitizeForFirestore({
      ...updated,
      updatedAt: new Date().toISOString(),
    }), { merge: true }).catch((err) => console.error('Firestore secrets save error:', err));
  } catch (e) {
    console.error('Failed to save secrets:', e);
  }
  return updated;
}

// --- Admin Auth ---
export function isAdminAuthenticated(): boolean {
  try {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(auth: boolean): void {
  try {
    if (auth) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  } catch (e) {
    console.error('Failed to set auth state:', e);
  }
}

export function verifyAdminPassword(password: string): boolean {
  const secrets = getSecretKeys();
  const validPassword = secrets.adminPassword || 'admin1234';
  if (password === validPassword) {
    setAdminAuthenticated(true);
    return true;
  }
  return false;
}

// --- Posts Storage with Realtime Firestore Persistence ---
export function getPosts(): BlogPost[] {
  try {
    const saved = localStorage.getItem(POSTS_KEY);
    if (saved) {
      const parsed: BlogPost[] = JSON.parse(saved);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => sanitizeBlogPostData(p));
      }
    }
  } catch (e) {
    console.error('Error reading posts from storage:', e);
  }
  // Fallback to initial sample posts
  const sanitizedInit = INITIAL_POSTS.map((p) => sanitizeBlogPostData(p));
  savePosts(sanitizedInit);
  return sanitizedInit;
}

export function savePosts(posts: BlogPost[]): void {
  try {
    const sanitized = posts.map((p) => sanitizeBlogPostData(p));
    localStorage.setItem(POSTS_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Error saving posts to storage:', e);
  }
}

// Fetch all posts directly from Firestore
export async function fetchPostsFromFirestore(): Promise<BlogPost[]> {
  try {
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    if (snapshot.empty) {
      console.log('Firestore posts empty. Seeding INITIAL_POSTS...');
      const sanitizedInit = INITIAL_POSTS.map((p) => sanitizeBlogPostData(p));
      for (const post of sanitizedInit) {
        await setDoc(doc(db, 'posts', post.id), sanitizeForFirestore(post));
      }
      savePosts(sanitizedInit);
      return sanitizedInit;
    }
    const firestorePosts: BlogPost[] = snapshot.docs.map((d) =>
      sanitizeBlogPostData(d.data() as BlogPost)
    );
    firestorePosts.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.publishedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.publishedAt || 0).getTime();
      return timeB - timeA;
    });
    savePosts(firestorePosts);
    return firestorePosts;
  } catch (err) {
    console.error('Error fetching posts from Firestore:', err);
    return getPosts();
  }
}

// Subscribe to real-time updates from Firestore posts collection
export function subscribePosts(onUpdate: (posts: BlogPost[]) => void): () => void {
  const postsRef = collection(db, 'posts');

  const unsubscribe = onSnapshot(
    postsRef,
    async (snapshot) => {
      const sanitizedInit = INITIAL_POSTS.map((p) => sanitizeBlogPostData(p));
      if (snapshot.empty) {
        // Seed initial posts to Firestore
        console.log('Firestore posts collection is empty. Seeding initial posts to Firestore...');
        for (const post of sanitizedInit) {
          try {
            await setDoc(doc(db, 'posts', post.id), sanitizeForFirestore(post));
          } catch (err) {
            console.error(`Error seeding post ${post.id} to Firestore:`, err);
          }
        }
        syncSitemapToFirestore(sanitizedInit);
        savePosts(sanitizedInit);
        onUpdate(sanitizedInit);
        return;
      }

      const firestorePosts: BlogPost[] = snapshot.docs.map((d) =>
        sanitizeBlogPostData(d.data() as BlogPost)
      );
      // Sort by creation or publication date descending
      firestorePosts.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.publishedAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.publishedAt || 0).getTime();
        return timeB - timeA;
      });

      console.log(`Firestore snapshot sync: ${firestorePosts.length} posts loaded from Firestore.`);
      savePosts(firestorePosts);
      syncSitemapToFirestore(firestorePosts);
      onUpdate(firestorePosts);
    },
    (error) => {
      console.error('Firestore posts snapshot error:', error);
      // Fallback to local posts
      onUpdate(getPosts());
    }
  );

  return unsubscribe;
}

export function getPostBySlugOrId(identifier: string): BlogPost | undefined {
  const posts = getPosts();
  return posts.find((p) => p.slug === identifier || p.id === identifier);
}

export async function createPost(
  newPostData: Omit<BlogPost, 'id' | 'views' | 'likes'>
): Promise<BlogPost> {
  const posts = getPosts();
  const id = 'post-' + Date.now();
  const cleanedData = sanitizeBlogPostData(newPostData);
  const newPost: BlogPost = {
    ...cleanedData,
    id,
    views: 1,
    likes: 0,
    publishedAt: cleanedData.publishedAt || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
  const updated = [newPost, ...posts];
  savePosts(updated);

  try {
    console.log(`Writing new post to Firestore (id: ${id})...`);
    await setDoc(doc(db, 'posts', id), sanitizeForFirestore(newPost));
    console.log(`Successfully saved post ${id} to Firestore.`);
    syncSitemapToFirestore(updated);
  } catch (err) {
    console.error(`Failed to save post ${id} to Firestore:`, err);
  }

  return newPost;
}

export async function updatePost(
  id: string,
  updates: Partial<BlogPost>
): Promise<BlogPost | undefined> {
  const posts = getPosts();
  let updatedPost: BlogPost | undefined;
  const cleanedUpdates = sanitizeBlogPostData(updates);
  const updatedPosts = posts.map((post) => {
    if (post.id === id) {
      updatedPost = sanitizeBlogPostData({
        ...post,
        ...cleanedUpdates,
        updatedAt: new Date().toISOString().split('T')[0],
      });
      return updatedPost;
    }
    return post;
  });

  if (updatedPost) {
    savePosts(updatedPosts);
    try {
      console.log(`Updating post in Firestore (id: ${id})...`);
      await setDoc(doc(db, 'posts', id), sanitizeForFirestore(updatedPost), { merge: true });
      console.log(`Successfully updated post ${id} in Firestore.`);
      syncSitemapToFirestore(updatedPosts);
    } catch (err) {
      console.error(`Failed to update post ${id} in Firestore:`, err);
    }
  }
  return updatedPost;
}

export async function deletePost(id: string): Promise<void> {
  const posts = getPosts();
  const filtered = posts.filter((p) => p.id !== id);
  savePosts(filtered);

  try {
    console.log(`Deleting post from Firestore (id: ${id})...`);
    await deleteDoc(doc(db, 'posts', id));
    console.log(`Successfully deleted post ${id} from Firestore.`);
    syncSitemapToFirestore(filtered);
  } catch (err) {
    console.error(`Failed to delete post ${id} from Firestore:`, err);
  }
}

export function incrementPostViews(id: string): void {
  const posts = getPosts();
  let newViews = 1;
  const updated = posts.map((p) => {
    if (p.id === id) {
      newViews = (p.views || 0) + 1;
      return { ...p, views: newViews };
    }
    return p;
  });
  savePosts(updated);

  // Sync to Firestore
  setDoc(doc(db, 'posts', id), { views: newViews }, { merge: true }).catch((err) =>
    console.error('Firestore incrementPostViews error:', err)
  );
}

export function incrementPostLikes(id: string): number {
  const posts = getPosts();
  let newLikes = 0;
  const updated = posts.map((p) => {
    if (p.id === id) {
      newLikes = (p.likes || 0) + 1;
      return { ...p, likes: newLikes };
    }
    return p;
  });
  savePosts(updated);

  // Sync to Firestore
  setDoc(doc(db, 'posts', id), { likes: newLikes }, { merge: true }).catch((err) =>
    console.error('Firestore incrementPostLikes error:', err)
  );

  return newLikes;
}

// --- Comments Storage with Realtime Firestore Persistence ---
export function getComments(postId: string): PostComment[] {
  try {
    const saved = localStorage.getItem(COMMENTS_KEY);
    if (saved) {
      const allComments: PostComment[] = JSON.parse(saved);
      return allComments.filter((c) => c.postId === postId);
    }
  } catch (e) {
    console.error('Error fetching comments:', e);
  }
  return [];
}

export function subscribeComments(postId: string, onUpdate: (comments: PostComment[]) => void): () => void {
  const commentsRef = collection(db, 'comments');

  const unsubscribe = onSnapshot(
    commentsRef,
    (snapshot) => {
      const allComments: PostComment[] = snapshot.docs.map((d) => d.data() as PostComment);
      const postComments = allComments.filter((c) => c.postId === postId);
      onUpdate(postComments);
    },
    (err) => {
      console.error('Firestore comments snapshot error:', err);
      onUpdate(getComments(postId));
    }
  );

  return unsubscribe;
}

export function addComment(commentData: Omit<PostComment, 'id' | 'createdAt'>): PostComment {
  try {
    const saved = localStorage.getItem(COMMENTS_KEY);
    const allComments: PostComment[] = saved ? JSON.parse(saved) : [];
    const newComment: PostComment = {
      ...commentData,
      id: 'comment-' + Date.now(),
      createdAt: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    allComments.unshift(newComment);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));

    // Save to Firestore
    setDoc(doc(db, 'comments', newComment.id), sanitizeForFirestore(newComment)).catch((err) =>
      console.error('Firestore addComment error:', err)
    );

    return newComment;
  } catch (e) {
    console.error('Error adding comment:', e);
    throw e;
  }
}

// --- Subscribers Storage with Realtime Firestore Persistence ---
export function getSubscribers(): NewsletterSubscriber[] {
  try {
    const saved = localStorage.getItem(SUBSCRIBERS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading subscribers:', e);
  }
  return [];
}

export function saveSubscribers(subs: NewsletterSubscriber[]): void {
  try {
    localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(subs));
  } catch (e) {
    console.error('Error saving subscribers:', e);
  }
}

export function subscribeSubscribers(onUpdate: (subs: NewsletterSubscriber[]) => void): () => void {
  const subsRef = collection(db, 'subscribers');

  const unsubscribe = onSnapshot(
    subsRef,
    (snapshot) => {
      const firestoreSubs: NewsletterSubscriber[] = snapshot.docs.map((d) => d.data() as NewsletterSubscriber);
      firestoreSubs.sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime());
      saveSubscribers(firestoreSubs);
      onUpdate(firestoreSubs);
    },
    (err) => {
      console.error('Firestore subscribers snapshot error:', err);
      onUpdate(getSubscribers());
    }
  );

  return unsubscribe;
}

export async function addSubscriber(email: string, source: string = 'footer_form'): Promise<NewsletterSubscriber> {
  const current = getSubscribers();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const existing = current.find((s) => (s?.email || '').toLowerCase() === normalizedEmail);

  if (existing) {
    if (existing.status === 'unsubscribed') {
      const updated = { ...existing, status: 'active' as const, subscribedAt: new Date().toISOString() };
      setDoc(doc(db, 'subscribers', existing.id), sanitizeForFirestore(updated), { merge: true }).catch(console.error);
      const updatedList = current.map((s) => (s.id === existing.id ? updated : s));
      saveSubscribers(updatedList);
      return updated;
    }
    return existing;
  }

  const id = 'sub-' + Date.now();
  const newSub: NewsletterSubscriber = {
    id,
    email: normalizedEmail,
    subscribedAt: new Date().toISOString(),
    status: 'active',
    source,
  };

  const updatedList = [newSub, ...current];
  saveSubscribers(updatedList);

  try {
    await setDoc(doc(db, 'subscribers', id), sanitizeForFirestore(newSub));
  } catch (err) {
    console.error('Firestore addSubscriber error:', err);
  }

  return newSub;
}

export async function updateSubscriberStatus(id: string, status: 'active' | 'unsubscribed'): Promise<void> {
  const current = getSubscribers();
  const updated = current.map((s) => (s.id === id ? { ...s, status } : s));
  saveSubscribers(updated);

  try {
    await setDoc(doc(db, 'subscribers', id), sanitizeForFirestore({ status }), { merge: true });
  } catch (err) {
    console.error('Firestore updateSubscriberStatus error:', err);
  }
}

export async function deleteSubscriber(id: string): Promise<void> {
  const current = getSubscribers();
  const filtered = current.filter((s) => s.id !== id);
  saveSubscribers(filtered);

  try {
    await deleteDoc(doc(db, 'subscribers', id));
  } catch (err) {
    console.error('Firestore deleteSubscriber error:', err);
  }
}

// --- Newsletters Storage with Realtime Firestore Persistence ---
export function getNewsletters(): NewsletterIssue[] {
  try {
    const saved = localStorage.getItem(NEWSLETTERS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading newsletters:', e);
  }
  return [];
}

export function saveNewsletters(newsletters: NewsletterIssue[]): void {
  try {
    localStorage.setItem(NEWSLETTERS_KEY, JSON.stringify(newsletters));
  } catch (e) {
    console.error('Error saving newsletters:', e);
  }
}

export function subscribeNewsletters(onUpdate: (newsletters: NewsletterIssue[]) => void): () => void {
  const newsRef = collection(db, 'newsletters');

  const unsubscribe = onSnapshot(
    newsRef,
    (snapshot) => {
      const firestoreNews: NewsletterIssue[] = snapshot.docs.map((d) => d.data() as NewsletterIssue);
      firestoreNews.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      saveNewsletters(firestoreNews);
      onUpdate(firestoreNews);
    },
    (err) => {
      console.error('Firestore newsletters snapshot error:', err);
      onUpdate(getNewsletters());
    }
  );

  return unsubscribe;
}

export async function sendNewsletter(issueData: Omit<NewsletterIssue, 'id' | 'sentAt' | 'status'>): Promise<NewsletterIssue> {
  const current = getNewsletters();
  const id = 'news-' + Date.now();
  const newIssue: NewsletterIssue = {
    ...issueData,
    id,
    sentAt: new Date().toISOString(),
    status: 'sent',
  };

  const updated = [newIssue, ...current];
  saveNewsletters(updated);

  try {
    await setDoc(doc(db, 'newsletters', id), sanitizeForFirestore(newIssue));
  } catch (err) {
    console.error('Firestore sendNewsletter error:', err);
  }

  return newIssue;
}

// --- Ads Configuration Storage with Realtime Firestore Persistence ---
export function getAdsConfig(): AdsConfig {
  try {
    const saved = localStorage.getItem(ADS_KEY);
    if (saved) {
      const parsed: AdsConfig = JSON.parse(saved);
      if (parsed && parsed.slots) {
        return {
          slots: {
            ...DEFAULT_ADS_CONFIG.slots,
            ...parsed.slots,
          },
        };
      }
    }
  } catch (e) {
    console.error('Error loading ads config:', e);
  }
  return DEFAULT_ADS_CONFIG;
}

export function saveAdsConfig(config: AdsConfig): AdsConfig {
  try {
    localStorage.setItem(ADS_KEY, JSON.stringify(config));
    // Persist to Firestore settings collection
    setDoc(doc(db, 'settings', 'ads'), sanitizeForFirestore({
      ...config,
      updatedAt: new Date().toISOString(),
    }), { merge: true }).catch((err) => console.error('Firestore ads save error:', err));
  } catch (e) {
    console.error('Failed to save ads config:', e);
  }
  return config;
}

export function subscribeAdsConfig(callback: (config: AdsConfig) => void): () => void {
  const initial = getAdsConfig();
  callback(initial);

  try {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'ads'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.slots) {
            const merged: AdsConfig = {
              slots: {
                ...DEFAULT_ADS_CONFIG.slots,
                ...data.slots,
              },
            };
            localStorage.setItem(ADS_KEY, JSON.stringify(merged));
            callback(merged);
          }
        } else {
          saveAdsConfig(initial);
        }
      },
      (error) => {
        console.error('Firestore subscribeAdsConfig error:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to setup subscribeAdsConfig:', err);
    return () => {};
  }
}

// --- Static Pages Content Storage (About, Terms, Privacy) ---
const PAGES_KEY = 'modablog_static_pages_v1';

export const DEFAULT_STATIC_PAGES: StaticPagesConfig = {
  about: {
    title: '디지털생활연구소 소개',
    subtitle: '더 편리하고 스마트한 일상을 위한 정보 가이드',
    content: `**디지털생활연구소**는 복잡하고 빠르게 변화하는 디지털 환경 속에서 누구나 쉽게 생활의 편리함을 누릴 수 있도록 유익한 정보와 유용한 팁을 나누는 공간입니다.

우리가 매일 접하는 수많은 서비스와 정보들은 알면 알수록 일상의 번거로움을 줄여주고 삶의 효율성을 높여줍니다. 하지만 정보가 지나치게 많거나 설명이 다소 어렵고 복잡하여 정작 필요한 순간에 제대로 활용하지 못하는 경우가 많습니다.

디지털생활연구소는 어려운 전문 용어 대신 **누구나 쉽게 이해하고 따라할 수 있는 친절하고 명확한 가이드**를 바탕으로 실생활에 꼭 필요한 알찬 정보들을 체계적으로 정돈하여 전달합니다.

단순히 단편적인 지식을 나열하는 것에 그치지 않고, 실제로 정보가 필요한 순간 부딪히는 문제점이나 궁금증을 시원하게 해결할 수 있도록 실용적이고 정확한 가치를 전달하는 데 집중하고 있습니다.

앞으로도 독자 여러분의 일상에 작은 편리함과 긍정적인 변화를 더할 수 있도록 유익한 콘텐츠를 지속적으로 발전시켜 나가겠습니다.`,
  },
  terms: {
    title: '서비스 이용약관 및 저작권 정책',
    subtitle: '디지털생활연구소 서비스 이용약관',
    content: `### 제 1 조 (목적)
본 약관은 **디지털생활연구소**가 제공하는 정보 가이드 및 블로그 관련 웹 서비스의 이용 조건과 절차를 규정함을 목적으로 합니다. 독자는 본 플랫폼의 정보를 이용함으로써 본 약관에 동의한 것으로 간주됩니다.

### 제 2 조 (저작권 및 인용)
디지털생활연구소에 게시된 모든 콘텐츠에 대한 저작권은 본 연구소에 있습니다. 출처(디지털생활연구소 및 게시글 URL)를 명확히 밝히는 링크 공유 및 일부 인용은 허용되나, 사전 동의 없는 무단 전재 및 자동 재배포는 금지합니다.

### 제 3 조 (면책조항)
디지털생활연구소의 콘텐츠 및 가이드는 일상 생활 정보 제공을 목적으로 작성되었습니다. 정보의 정확성을 기하고자 노력하나, 적용 결과 및 특정 목적에 대한 적합성을 보증하지는 않으며 이에 따른 직접적 손해에 책임을 지지 않습니다.`,
  },
  privacy: {
    title: '개인정보처리방침',
    subtitle: '디지털생활연구소 개인정보 보호 안내',
    content: `### 1. 개인정보 보호 원칙
**디지털생활연구소**는 독자의 개인정보 보호를 최우선으로 생각합니다. 불필요한 개인정보 수집이나 타깃 광고 추적을 하지 않으며, 개인정보를 제3자에게 매매하거나 남용하지 않습니다.

### 2. 수집하는 데이터 및 이용 목적
본 블로그는 원활한 서비스 제공을 위하여 최소한의 정보만을 처리합니다.

- **댓글 작성 정보:** 아티클 댓글 작성 시 사용자가 직접 입력한 작성자 이름 및 댓글 내용.
- **서비스 통계:** 개인 식별이 불가능한 게시글별 조회수 및 추천 수치.`,
  },
};

export function getStaticPages(): StaticPagesConfig {
  try {
    const saved = localStorage.getItem(PAGES_KEY);
    if (saved) {
      const parsed: StaticPagesConfig = JSON.parse(saved);
      if (parsed && parsed.about && parsed.terms && parsed.privacy) {
        return {
          about: { ...DEFAULT_STATIC_PAGES.about, ...parsed.about },
          terms: { ...DEFAULT_STATIC_PAGES.terms, ...parsed.terms },
          privacy: { ...DEFAULT_STATIC_PAGES.privacy, ...parsed.privacy },
        };
      }
    }
  } catch (e) {
    console.error('Error loading static pages:', e);
  }
  return DEFAULT_STATIC_PAGES;
}

export function saveStaticPages(pages: StaticPagesConfig): StaticPagesConfig {
  try {
    localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
    setDoc(doc(db, 'settings', 'pages'), sanitizeForFirestore({
      ...pages,
      updatedAt: new Date().toISOString(),
    }), { merge: true }).catch((err) => console.error('Firestore static pages save error:', err));
  } catch (e) {
    console.error('Failed to save static pages:', e);
  }
  return pages;
}

export function subscribeStaticPages(callback: (pages: StaticPagesConfig) => void): () => void {
  const initial = getStaticPages();
  callback(initial);

  try {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'pages'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.about && data.terms && data.privacy) {
            const merged: StaticPagesConfig = {
              about: { ...DEFAULT_STATIC_PAGES.about, ...data.about },
              terms: { ...DEFAULT_STATIC_PAGES.terms, ...data.terms },
              privacy: { ...DEFAULT_STATIC_PAGES.privacy, ...data.privacy },
            };
            localStorage.setItem(PAGES_KEY, JSON.stringify(merged));
            callback(merged);
          }
        } else {
          saveStaticPages(initial);
        }
      },
      (error) => {
        console.error('Firestore subscribeStaticPages error:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to setup subscribeStaticPages:', err);
    return () => {};
  }
}



