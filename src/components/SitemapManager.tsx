import React, { useState } from 'react';
import { Rss, RefreshCw, CheckCircle2, Globe, ExternalLink } from 'lucide-react';
import { BlogPost } from '../types';

interface SitemapManagerProps {
  posts: BlogPost[];
}

export const SitemapManager: React.FC<SitemapManagerProps> = ({ posts }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);

  const publishedPosts = posts.filter((p) => p.published !== false);

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

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
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

        <div className="flex items-center gap-2">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open /sitemap.xml
          </a>
          <button
            onClick={handleUpdateSitemap}
            disabled={isUpdating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
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
