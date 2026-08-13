import React, { useState, useEffect } from 'react';
import { FileText, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getStaticPages, subscribeStaticPages } from '../services/storage';
import { StaticPageData } from '../types';

interface TermsViewProps {
  isAdmin?: boolean;
  onEditPage?: () => void;
}

export const TermsView: React.FC<TermsViewProps> = ({ isAdmin, onEditPage }) => {
  const [pageData, setPageData] = useState<StaticPageData>(getStaticPages().terms);

  useEffect(() => {
    const unsub = subscribeStaticPages((pages) => {
      if (pages.terms) {
        setPageData(pages.terms);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      <div className="space-y-3 text-center">
        <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          이용약관
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">
          {pageData.title || '서비스 이용약관 및 저작권 정책'}
        </h1>
        {pageData.subtitle && <p className="text-xs text-slate-500">{pageData.subtitle}</p>}

        {isAdmin && onEditPage && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={onEditPage}
              className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>이용약관 내용 편집하기</span>
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
