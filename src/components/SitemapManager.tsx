import React, { useState } from 'react';
import { Rss, RefreshCw, CheckCircle2, ExternalLink, Download, Copy, Check, FileCode } from 'lucide-react';
import { BlogPost } from '../types';
import { generateSitemapXml } from '../services/storage';

interface SitemapManagerProps {
  posts: BlogPost[];
}

export const SitemapManager: React.FC<SitemapManagerProps> = ({ posts }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [copied, setCopied] = useState(false);

  const publishedPosts = posts.filter((p) => p.published !== false);

  // Helper to format clean slug from post
  const getPostSlug = (post: BlogPost): string => {
    let slug = (post.slug || '').trim();
    if (!slug || /^post-\d+$/.test(slug)) {
      slug = (post.title || '')
        .trim()
        .toLowerCase()
        .replace(/[^\w\s가-힣-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    return slug || post.id;
  };

  const handleUpdateSitemap = async () => {
    setIsUpdating(true);
    setUpdated(false);
    try {
      const res = await fetch('/api/update-sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: publishedPosts }),
      });
      if (res.ok) {
        setUpdated(true);
        setTimeout(() => setUpdated(false), 3000);
      }
    } catch (e) {
      console.error('Failed to update sitemap:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadSitemap = () => {
    const xmlContent = generateSitemapXml(posts);
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyXml = () => {
    const xmlContent = generateSitemapXml(posts);
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shadow-inner">
            <Rss className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              사이트맵 & SEO 관리 <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">sitemap.xml</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              구글 서치콘솔 및 네이버 서치어드바이저 수집용 자동 사이트맵 관리자입니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sitemap Download Button */}
          <button
            onClick={handleDownloadSitemap}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-950 flex items-center gap-2 cursor-pointer"
            title="sitemap.xml 파일 직접 다운로드"
          >
            <Download className="w-4 h-4" />
            sitemap.xml 다운로드
          </button>

          {/* Copy XML Button */}
          <button
            onClick={handleCopyXml}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '복사 완료' : 'XML 복사'}
          </button>

          {/* Open /sitemap.xml Link */}
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 border border-slate-700/60"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            /sitemap.xml 열기
          </a>

          {/* Re-index & Update Server Cache */}
          <button
            onClick={handleUpdateSitemap}
            disabled={isUpdating}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin text-emerald-400' : ''}`} />
            {isUpdating ? '갱신 중...' : '서버 캐시 동기화'}
          </button>
        </div>
      </div>

      {updated && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>사이트맵이 성공적으로 서버 캐시에 동기화되었습니다!</span>
        </div>
      )}

      {/* Indexed Routes Table Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold uppercase text-slate-300 flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-emerald-400" />
            사이트맵 수집 대상 경로 ({publishedPosts.length + 4}개 URL)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">SEO Optimization Status: Active</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden text-xs font-mono">
          <div className="grid grid-cols-12 bg-slate-900/80 p-3 font-bold text-slate-400 border-b border-slate-800">
            <div className="col-span-6">URL Location</div>
            <div className="col-span-3">Type</div>
            <div className="col-span-3">Priority</div>
          </div>

          <div className="divide-y divide-slate-800/60 text-slate-300">
            <div className="grid grid-cols-12 p-3 hover:bg-slate-900/40">
              <div className="col-span-6 text-blue-400 font-semibold">/ (Blog Main Homepage)</div>
              <div className="col-span-3 text-slate-400">Static Route</div>
              <div className="col-span-3 text-emerald-400 font-bold">1.0 (High)</div>
            </div>
            <div className="grid grid-cols-12 p-3 hover:bg-slate-900/40">
              <div className="col-span-6 text-blue-400 font-semibold">/about (About Mission)</div>
              <div className="col-span-3 text-slate-400">Static Route</div>
              <div className="col-span-3 text-slate-400">0.8</div>
            </div>
            <div className="grid grid-cols-12 p-3 hover:bg-slate-900/40">
              <div className="col-span-6 text-blue-400 font-semibold">/terms (Terms of Service)</div>
              <div className="col-span-3 text-slate-400">Static Route</div>
              <div className="col-span-3 text-slate-400">0.5</div>
            </div>
            <div className="grid grid-cols-12 p-3 hover:bg-slate-900/40">
              <div className="col-span-6 text-blue-400 font-semibold">/privacy (Privacy Policy)</div>
              <div className="col-span-3 text-slate-400">Static Route</div>
              <div className="col-span-3 text-slate-400">0.5</div>
            </div>

            {publishedPosts.map((post, idx) => {
              const slug = getPostSlug(post);
              return (
                <div key={post.id || slug || `sitemap-route-${idx}`} className="grid grid-cols-12 p-3 hover:bg-slate-900/40">
                  <div className="col-span-6 truncate text-slate-200" title={`/post/${slug}`}>
                    /post/{slug}
                  </div>
                  <div className="col-span-3 text-purple-400">Published Article</div>
                  <div className="col-span-3 text-slate-400">0.8</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
