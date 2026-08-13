import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BlogHome } from './components/BlogHome';
import { PostDetail } from './components/PostDetail';
import { AboutView } from './components/AboutView';
import { TermsView } from './components/TermsView';
import { PrivacyView } from './components/PrivacyView';
import { AdminModal } from './components/AdminModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BlogPost, SecretKeysConfig } from './types';
import {
  auth,
  onAuthStateChanged,
  loginWithGoogle,
  logoutFirebase,
  User,
} from './lib/firebase';
import {
  getPosts,
  subscribePosts,
  getSecretKeys,
  isAdminAuthenticated,
  setAdminAuthenticated,
  createPost,
  updatePost,
  deletePost,
} from './services/storage';

export default function App() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Admin Auth, Google User & Secret state
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [secrets, setSecrets] = useState<SecretKeysConfig>(getSecretKeys());

  // Helper to sync app view state with window.location.pathname
  const syncRouteFromUrl = (availablePosts: BlogPost[]) => {
    const rawPath = window.location.pathname;
    const path = decodeURIComponent(rawPath);

    if (path === '/' || path === '') {
      setCurrentView('home');
      setSelectedPost(null);
    } else if (path === '/about') {
      setCurrentView('about');
      setSelectedPost(null);
    } else if (path === '/terms') {
      setCurrentView('terms');
      setSelectedPost(null);
    } else if (path === '/privacy') {
      setCurrentView('privacy');
      setSelectedPost(null);
    } else if (path === '/admin' || path === '/admin-login') {
      setShowAdminModal(true);
    } else if (path.startsWith('/post/')) {
      const targetSlug = path.substring(6).trim();
      if (targetSlug && availablePosts && availablePosts.length > 0) {
        const found = availablePosts.find((p) => {
          const postSlug = p.slug || p.id;
          return (
            postSlug === targetSlug ||
            p.id === targetSlug ||
            encodeURIComponent(postSlug) === targetSlug ||
            (postSlug || '').toLowerCase() === (targetSlug || '').toLowerCase()
          );
        });

        if (found) {
          setSelectedPost(found);
          setCurrentView('post');
        }
      }
    }
  };

  useEffect(() => {
    // Initial local posts load & route sync
    const initialPosts = getPosts();
    setPosts(initialPosts);
    if (isAdminAuthenticated()) {
      setIsAdmin(true);
    }

    syncRouteFromUrl(initialPosts);

    // Subscribe to Firestore Posts for real-time synchronization
    const unsubscribePosts = subscribePosts((updatedPosts) => {
      setPosts(updatedPosts);
      syncRouteFromUrl(updatedPosts);
    });

    // Subscribe to Firebase Google Authentication status
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User logged in with Google -> Automatically grant Admin Role
        setGoogleUser(user);
        setIsAdmin(true);
        setAdminAuthenticated(true);
      } else {
        setGoogleUser(null);
      }
    });

    // Handle browser Back/Forward popstate navigation
    const handlePopState = () => {
      const currentPosts = getPosts();
      syncRouteFromUrl(currentPosts);
    };

    // Keyboard shortcut listener for secret admin login (Ctrl + Shift + A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setShowAdminModal(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribePosts();
      unsubscribeAuth();
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Navigation Handler
  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view !== 'post') {
      setSelectedPost(null);
    }

    let targetPath = '/';
    if (view === 'about') targetPath = '/about';
    else if (view === 'terms') targetPath = '/terms';
    else if (view === 'privacy') targetPath = '/privacy';
    else if (view === 'admin-dashboard') targetPath = '/admin';

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPost = (post: BlogPost) => {
    setSelectedPost(post);
    setCurrentView('post');

    const slug = post.slug || post.id;
    const targetPath = `/post/${slug}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoogleLoginTrigger = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        setGoogleUser(user);
        setIsAdmin(true);
        setAdminAuthenticated(true);
        setShowAdminModal(false);
        setCurrentView('admin-dashboard');
      }
    } catch (err) {
      console.error('Google Login error:', err);
      throw err;
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdmin(true);
    setAdminAuthenticated(true);
    setShowAdminModal(false);
    setCurrentView('admin-dashboard');
  };

  const handleLogoutAdmin = async () => {
    await logoutFirebase();
    setAdminAuthenticated(false);
    setIsAdmin(false);
    setGoogleUser(null);
    if (currentView === 'admin-dashboard') {
      setCurrentView('home');
    }
  };

  const handleCreatePost = async (newPostData: Omit<BlogPost, 'id' | 'views' | 'likes'>) => {
    const created = await createPost(newPostData);
    setPosts(getPosts());
    handleSelectPost(created);
  };

  const handleUpdatePost = async (id: string, updates: Partial<BlogPost>) => {
    await updatePost(id, updates);
    setPosts(getPosts());
  };

  const handleDeletePost = async (id: string) => {
    await deletePost(id);
    setPosts(getPosts());
    if (selectedPost && selectedPost.id === id) {
      handleNavigate('home');
    }
  };

  const handleUpdateSecrets = (updatedKeys: SecretKeysConfig) => {
    setSecrets(updatedKeys);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        isAdmin={isAdmin}
        googleUser={googleUser}
        onGoogleLogin={handleGoogleLoginTrigger}
        onOpenAdminModal={() => setShowAdminModal(true)}
        onOpenAdminDashboard={() => setCurrentView('admin-dashboard')}
        onLogoutAdmin={handleLogoutAdmin}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main View Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6">
        {currentView === 'home' && (
          <BlogHome
            posts={posts}
            onSelectPost={handleSelectPost}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
          />
        )}

        {currentView === 'post' && selectedPost && (
          <PostDetail
            post={selectedPost}
            allPosts={posts}
            onBack={() => handleNavigate('home')}
            onSelectPost={handleSelectPost}
          />
        )}

        {currentView === 'about' && (
          <AboutView
            isAdmin={isAdmin}
            onEditPage={() => setCurrentView('admin-dashboard')}
          />
        )}

        {currentView === 'terms' && (
          <TermsView
            isAdmin={isAdmin}
            onEditPage={() => setCurrentView('admin-dashboard')}
          />
        )}

        {currentView === 'privacy' && (
          <PrivacyView
            isAdmin={isAdmin}
            onEditPage={() => setCurrentView('admin-dashboard')}
          />
        )}

        {currentView === 'admin-dashboard' && isAdmin && (
          <AdminDashboard
            posts={posts}
            secrets={secrets}
            onExitAdmin={() => handleNavigate('home')}
            onCreatePost={handleCreatePost}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onUpdateSecrets={handleUpdateSecrets}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenAdminModal={() => setShowAdminModal(true)}
      />

      {/* Secret Admin Authentication Modal */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={handleAdminAuthSuccess}
        onGoogleLogin={handleGoogleLoginTrigger}
      />
    </div>
  );
}

