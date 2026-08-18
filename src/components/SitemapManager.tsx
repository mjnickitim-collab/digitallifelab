import React, { useState } from 'react';
import { Rss, RefreshCw, CheckCircle2, Globe, ExternalLink, Download } from 'lucide-react';
import { BlogPost } from '../types';

interface SitemapManagerProps {
  posts: BlogPost[];
}

export const SitemapManager: React.FC<SitemapManagerProps> = ({ posts }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const publishedPosts = posts.filter((p) => p.published !== false);

  const generateXmlLocally = (baseUrl: string): string => {
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

    publishedPosts.forEach((post) => {
      const slug = post.slug || post.id;
      const lastmod = post.publishedAt || now;
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/post/${encodeURIComponent(slug)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;
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

  const handleDownloadSitemap = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      // 1. Sync latest posts to server first
      try {
        await fetch('/api/update-sitemap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ posts: publishedPosts }),
        });
      } catch (err) {
        console.warn('Could not sync to server before download, using local generator:', err);
      }

      // 2. Fetch sitemap or use local XML generator
      let xmlContent = '';
      try {
        const res = await fetch('/sitemap.xml');
        if (res.ok) {
          xmlContent = await res.text();
        }
      } catch (e) {
        console.warn('Fetch /sitemap.xml failed, using client generation:', e);
      }

      if (!xmlContent || !xmlContent.includes('<urlset')) {
        const origin = window.location.origin;
        xmlContent = generateXmlLocally(origin);
      }

      // 3. Create blob and trigger file download
      const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sitemap.xml';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Download sitemap error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
            <Rss className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">
              Sitemap & SEO Manager (`/sitemap.xml`)
            </h2>
            <p className="text-xs text-slate-400">
              Automatic XML sitemap generator for Google & search engine crawlers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Download sitemap.xml button */}
          <button
            type="button"
            onClick={handleDownloadSitemap}
            disabled={isDownloading}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="sitemap.xml 파일을 내 PC로 다운로드합니다"
          >
            <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
            {isDownloading ? '다운로드 중...' : 'sitemap.xml 다운로드'}
          </button>

          {/* Open /sitemap.xml in browser */}
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open /sitemap.xml
          </a>

          {/* Re-index & Update Server Cache */}
          <button
            onClick={handleUpdateSitemap}
            disabled={isUpdating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Updating Cache...' : 'Re-index & Update Sitemap'}
          </button>
        </div>
      </div>

      {updated && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Sitemap.xml successfully refreshed and cached in-memory!</span>
        </div>
      )}

      {downloadSuccess && (
        <div className="p-3 bg-blue-950/60 border border-blue-800 text-blue-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>sitemap.xml 파일이 브라우저에 성공적으로 다운로드되었습니다!</span>
        </div>
      )}

      {/* Indexed Routes Table Preview */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-semibold uppercase text-slate-300">
          Currently Indexed Routes ({publishedPosts.length + 4} total URLs)
        </h3>

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

            {publishedPosts.map((post) => (
              <div key={post.id} className="grid grid-cols-12 p-3 hover:bg-slate-900/40">
                <div className="col-span-6 truncate text-slate-200">
                  /post/{post.slug || post.id}
                </div>
                <div className="col-span-3 text-purple-400">Published Article</div>
                <div className="col-span-3 text-slate-400">0.8</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
