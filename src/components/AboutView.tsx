import React, { useState, useEffect } from 'react';
import { Sparkles, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getStaticPages, subscribeStaticPages } from '../services/storage';
import { StaticPageData } from '../types';

interface AboutViewProps {
  isAdmin?: boolean;
  onEditPage?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ isAdmin, onEditPage }) => {
  const [pageData, setPageData] = useState<StaticPageData>(getStaticPages().about);

  useEffect(() => {
    const unsub = subscribeStaticPages((pages) => {
      if (pages.about) {
        setPageData(pages.about);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-10">
      {/* Header */}
      <div className="text-center space-y-4 relative">
        <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 border border-emerald-100/80 px-3.5 py-1.5 rounded-full">
          About Us
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">
          {pageData.title || '디지털생활연구소 소개'}
        </h1>
        {pageData.subtitle && (
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            {pageData.subtitle}
          </p>
        )}

        {isAdmin && onEditPage && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={onEditPage}
              className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>소개 페이지 내용 편집하기</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Intro Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 space-y-8 shadow-xs">
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">디지털생활연구소에 오신 것을 환영합니다</h2>
            <p className="text-xs text-slate-500 font-mono pt-0.5">Digital Life Lab Info & Guide</p>
          </div>
        </div>

        <div className="text-sm sm:text-base text-slate-700 leading-relaxed font-sans prose prose-slate max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {pageData.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
