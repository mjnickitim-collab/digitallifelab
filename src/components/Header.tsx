import React, { useState } from 'react';
import { Search, LogOut, LayoutDashboard } from 'lucide-react';
import { User } from '../lib/firebase';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  isAdmin: boolean;
  googleUser?: User | null;
  onGoogleLogin?: () => void;
  onOpenAdminModal: () => void;
  onOpenAdminDashboard: () => void;
  onLogoutAdmin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const CATEGORIES_NAV = [
  { id: 'all', label: '전체' },
  { id: '건강·웰빙', label: '건강·웰빙' },
  { id: '경제', label: '경제' },
  { id: '생산성', label: '생산성' },
  { id: '리빙', label: '리빙' },
  { id: '여행', label: '여행' },
  { id: 'IT·기기', label: 'IT·기기' },
];

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  selectedCategory,
  onSelectCategory,
  isAdmin,
  googleUser,
  onGoogleLogin,
  onOpenAdminModal,
  onOpenAdminDashboard,
  onLogoutAdmin,
  searchQuery,
  onSearchChange,
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);

  const handleCategoryClick = (catId: string) => {
    onSelectCategory(catId);
    if (currentView !== 'home') {
      onNavigate('home');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs transition-all">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-3.5 min-h-[72px] flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <button
          onClick={() => {
            onSelectCategory('all');
            onNavigate('home');
          }}
          className="flex items-center gap-3 text-left group cursor-pointer shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-display font-black text-xl shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            D
          </div>
          <div>
            <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-slate-900 block leading-tight">
              디지털생활연구소
            </span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold tracking-wider uppercase block">
              Digital Life Lab
            </span>
          </div>
        </button>

        {/* Main Category Navigation Bar (Desktop) - Increased Font Size & Padding */}
        <nav className="hidden lg:flex items-center gap-2 text-base sm:text-[16px] font-bold text-slate-800 overflow-x-auto py-1">
          {CATEGORIES_NAV.map((cat) => {
            const isActive = currentView === 'home' && selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-900 bg-emerald-100/80 font-extrabold border border-emerald-300/80 shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Items: Search & Admin Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Toggle */}
          <div className="relative flex items-center">
            {showSearchInput ? (
              <div className="flex items-center bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 w-44 sm:w-56 transition-all">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="검색어 입력..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  className="bg-transparent text-xs text-slate-800 outline-none w-full"
                />
                <button
                  onClick={() => {
                    setShowSearchInput(false);
                    onSearchChange('');
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowSearchInput(true);
                  if (currentView !== 'home') onNavigate('home');
                }}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="아티클 검색"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Admin Dashboard & Logout (Shown only when logged in as Admin) */}
          {isAdmin && (
            <div className="flex items-center gap-2 bg-slate-900 text-white pl-2.5 pr-1.5 py-1 rounded-full text-xs shadow-sm border border-slate-800">
              {googleUser?.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Admin'}
                  className="w-6 h-6 rounded-full ring-2 ring-emerald-500 shrink-0"
                />
              ) : (
                <span className="flex items-center gap-1 font-mono font-medium text-emerald-400 text-[11px] px-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Admin
                </span>
              )}

              {/* Admin Dashboard Navigation Button */}
              <button
                onClick={onOpenAdminDashboard}
                className={`px-3.5 py-1.5 text-white font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer text-xs shadow-2xs ${
                  currentView === 'admin-dashboard'
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
                title="어드민 대시보드 바로가기"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>어드민 대시보드</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogoutAdmin}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-full transition-colors cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Navigation Bar (Medium & Mobile) */}
      <div className="lg:hidden border-t border-slate-100 px-4 py-2 bg-slate-50/80 overflow-x-auto flex items-center gap-2 scrollbar-none text-sm font-semibold text-slate-700">
        {CATEGORIES_NAV.map((cat) => {
          const isActive = currentView === 'home' && selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors shrink-0 text-xs sm:text-sm font-semibold ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-white border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};

