import React, { useState, useEffect } from 'react';
import { ShieldCheck, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getStaticPages, subscribeStaticPages } from '../services/storage';
import { StaticPageData } from '../types';

interface PrivacyViewProps {
  isAdmin?: boolean;
  onEditPage?: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ isAdmin, onEditPage }) => {
  const [pageData, setPageData] = useState<StaticPageData>(getStaticPages().privacy);

  useEffect(() => {
    const unsub = subscribeStaticPages((pages) => {
      if (pages.privacy) {
        setPageData(pages.privacy);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      <div className="space-y-3 text-center">
        <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          개인정보 보호
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">
          {pageData.title || '개인정보처리방침'}
        </h1>
        {pageData.subtitle && <p className="text-xs text-slate-500">{pageData.subtitle}</p>}

        {isAdmin && onEditPage && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={onEditPage}
              className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>개인정보처리방침 내용 편집하기</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-8 text-sm text-slate-700 leading-relaxed shadow-xs prose prose-slate max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {pageData.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};
