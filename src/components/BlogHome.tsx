import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Eye, Heart, ArrowUpRight, Sparkles, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { BlogPost } from '../types';
import { CATEGORIES } from '../data/samplePosts';
import { AdBanner } from './AdBanner';

interface BlogHomeProps {
  posts: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onClearSearch: () => void;
}

const POSTS_PER_PAGE = 6;

export const BlogHome: React.FC<BlogHomeProps> = ({
  posts,
  onSelectPost,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onClearSearch,
}) => {
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'likes'>('latest');
  const [currentPage, setCurrentPage] = useState(1);

  // Set Homepage SEO Meta Tags
  useEffect(() => {
    document.title = '디지털생활연구소 - AI와 디지털 도구로 일상 불편을 해결하는 실용 가이드';

    const setMetaTag = (attrName: string, attrVal: string, contentVal: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentVal);
    };

    setMetaTag('name', 'description', '디지털생활연구소는 스마트폰, PC, AI 챗봇 등 스마트 디지털 도구를 활용하여 일상 속 생활 불편과 문제를 해결하는 실용적인 How-To 가이드 블로그입니다.');
    setMetaTag('name', 'keywords', '디지털생활연구소, 생활불편해결, AI활용법, 디지털도구, 생활꿀팁, How-To, 스마트폰활용, IT가이드, 생산성, 생활정보');
    setMetaTag('property', 'og:title', '디지털생활연구소 - AI와 디지털 도구로 일상 불편을 해결하는 실용 가이드');
    setMetaTag('property', 'og:description', '스마트폰, PC, AI 챗봇 등 디지털 도구로 일상 생활 속 불편함과 문제를 스마트하게 해결하는 실용 How-To 가이드 블로그입니다.');
  }, []);

  // Filter posts based on published status, selected category, and search query
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Must be published
      if (!post.published) return false;

      // Category filter
      if (selectedCategory !== 'all' && post.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const titleMatch = (post.title || '').toLowerCase().includes(query);
        const excerptMatch = (post.excerpt || '').toLowerCase().includes(query);
        const tagMatch = Array.isArray(post.tags) && post.tags.some((t) => typeof t === 'string' && t.toLowerCase().includes(query));
        const authorMatch = (post.author?.name || '').toLowerCase().includes(query);
        return Boolean(titleMatch || excerptMatch || tagMatch || authorMatch);
      }

      return true;
    });
  }, [posts, selectedCategory, searchQuery]);

  // Sort filtered posts
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      if (sortBy === 'popular') return b.views - a.views;
      if (sortBy === 'likes') return b.likes - a.likes;
      // Default: latest date
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [filteredPosts, sortBy]);

  // Featured Hero post (pick the first post marked featured or the newest one)
  const featuredPost = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery) return null;
    return posts.find((p) => p.featured && p.published) || posts.find((p) => p.published) || null;
  }, [posts, selectedCategory, searchQuery]);

  // Non-featured posts for grid
  const listPosts = useMemo(() => {
    if (featuredPost && selectedCategory === 'all' && !searchQuery) {
      return sortedPosts.filter((p) => p.id !== featuredPost.id);
    }
    return sortedPosts;
  }, [sortedPosts, featuredPost, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(listPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return listPosts.slice(start, start + POSTS_PER_PAGE);
  }, [listPosts, currentPage]);

  const handleCategoryChange = (cat: string) => {
    onSelectCategory(cat);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-10 py-6">
      {/* Main Screen Top Ad Banner */}
      <AdBanner location="home_top" />

      {/* Search Header Banner if active query */}
      {searchQuery && (
        <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">
              "{searchQuery}" 검색 결과
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              총 {filteredPosts.length}개의 관련 글이 검색되었습니다.
            </p>
          </div>
          <button
            onClick={onClearSearch}
            className="px-3.5 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
          >
            검색 초기화
          </button>
        </div>
      )}

      {/* Hero Featured Article (Only shown on main view with no filters) */}
      {featuredPost && (
        <section className="relative">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => onSelectPost(featuredPost)}
            className="group cursor-pointer bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0"
          >
            {/* Image Column */}
            <div className="lg:col-span-7 relative min-h-[320px] lg:min-h-[440px] overflow-hidden bg-slate-900">
              <img
                src={featuredPost.coverImage}
                alt={featuredPost.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent lg:hidden" />
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-emerald-600 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full tracking-wider shadow-md">
                  ★ 추천 칼럼
                </span>
              </div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                  <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100/80 px-2.5 py-1 rounded-md">
                    {featuredPost.category}
                  </span>
                  <span>•</span>
                  <span>{featuredPost.publishedAt}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">
                  {featuredPost.title}
                </h1>

                {featuredPost.subtitle && (
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    {featuredPost.subtitle}
                  </p>
                )}

                <p className="text-xs sm:text-sm text-slate-500 line-clamp-3 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
              </div>

              {/* Author & Footer metadata */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {featuredPost.author.avatar ? (
                    <img
                      src={featuredPost.author.avatar}
                      alt={featuredPost.author.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-emerald-400 font-bold text-sm flex items-center justify-center border border-slate-800">
                      D
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{featuredPost.author.name}</h4>
                    <p className="text-[11px] text-slate-400">{featuredPost.publishedAt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                  <span>아티클 읽기</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Centered Category Header with custom description when a specific category is selected */}
      {selectedCategory !== 'all' && (() => {
        const categoryDescriptions: Record<string, string> = {
          '건강·웰빙': '스마트 워치 건강 모니터링, 수면 케어 앱, 올바른 거북목 예방 자세 관리 등 디지털 헬스케어 도구와 습관으로 매일 더 건강하고 활기찬 삶을 가꾸는 방법입니다.',
          '경제': '연말정산 스마트 환급, 앱테크 모으기, 주택청약 알림 설정, 통신비 절감 및 금융 스마트 앱을 활용해 일상 속 새나가는 돈을 막고 알뜰하게 자산을 관리하는 실용 경제 팁입니다.',
          '생산성': 'AI 타임 매니지먼트, 자동화 노트 정리, 카카오톡 및 스마트폰 업무 효율 설정, 구글 워크스페이스 꿀팁으로 불필요한 반복 작업을 줄이고 시간을 두 배로 버는 가이드입니다.',
          '리빙': '스마트홈 IoT 가전 연동, 전기·가스요금 스마트 절감, 분리수거 및 정부 생활 지원금 간편 신청 등 스마트 디지털 기술을 접목해 더욱 편리하고 쾌적한 주거 환경을 만듭니다.',
          '여행': '최저가 항공권 AI 비교, 모바일 여권 및 원스톱 간편 환전, 스마트 오프라인 지도 활용법과 실시간 번역 앱으로 길 찾기부터 일정 관리까지 완벽하게 해결하는 트래블 솔루션입니다.',
          'IT·기기': '스마트폰 저장공간 감쪽같이 확보하기, PC 속도 저하 긴급 해결, 카카오톡 수신확인 및 보안 설정, 알뜰폰 셀프 개통법 등 자주 겪는 디지털 기기 문제의 직관적인 해결책을 전합니다.'
        };

        const description = categoryDescriptions[selectedCategory] || `${selectedCategory} 분야의 생활 속 불편함과 문제를 스마트폰, PC, AI 등의 디지털 도구로 스마트하게 해결하는 실용 가이드입니다.`;

        return (
          <div className="py-8 px-4 text-center space-y-3 border border-slate-200/80 bg-gradient-to-b from-emerald-50/40 via-slate-50/50 to-white rounded-3xl my-2 shadow-2xs">
            <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight">
              {selectedCategory}
            </h1>
            <p className="text-xs sm:text-sm md:text-[15px] text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
              {description}
            </p>
          </div>
        );
      })()}

      {/* Sorting Controls and Count */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          총 <span className="font-bold text-emerald-600">{sortedPosts.length}개</span>의 아티클
        </p>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium outline-none cursor-pointer"
          >
            <option value="latest">최신순</option>
            <option value="popular">조회수순</option>
            <option value="likes">좋아요순</option>
          </select>
        </div>
      </div>

      {/* Main Screen Middle Ad Banner */}
      <AdBanner location="home_middle" />

      {/* Articles Grid */}
      {paginatedPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {paginatedPosts.map((post, idx) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => onSelectPost(post)}
              className="group cursor-pointer bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span>{post.publishedAt}</span>
                  </div>

                  <h3 className="text-lg font-display font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 pt-0 border-t border-slate-100/80 mt-4 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  {post.author.avatar ? (
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-emerald-400 font-bold text-[10px] flex items-center justify-center">
                      D
                    </div>
                  )}
                  <span className="font-medium text-slate-700 text-xs">{post.author.name}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1" title="조회수">
                    <Eye className="w-3.5 h-3.5" />
                    {post.views}
                  </span>
                  <span className="flex items-center gap-1 text-rose-500 font-medium" title="좋아요">
                    <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                    {post.likes}
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">검색된 포스트가 없습니다</h3>
          <p className="text-xs text-slate-500">
            선택한 카테고리나 검색어와 일치하는 발행 글이 없습니다.
          </p>
          <button
            onClick={() => {
              handleCategoryChange('all');
              onClearSearch();
            }}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer mt-2"
          >
            필터 초기화
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-mono">
            페이지 {currentPage} / {totalPages} (총 {listPosts.length}개의 아티클)
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> 이전
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === i + 1
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
            >
              다음 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Screen Bottom Ad Banner */}
      <AdBanner location="home_bottom" />
    </div>
  );
};
