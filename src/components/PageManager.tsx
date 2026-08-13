import React, { useState, useEffect } from 'react';
import { FileText, Save, CheckCircle2, Globe, Shield, Info, Edit3, Eye } from 'lucide-react';
import { StaticPagesConfig, StaticPageData } from '../types';
import { getStaticPages, saveStaticPages, subscribeStaticPages } from '../services/storage';
import { ClassicEditor } from './ClassicEditor';

export const PageManager: React.FC = () => {
  const [pagesConfig, setPagesConfig] = useState<StaticPagesConfig>(getStaticPages());
  const [selectedKey, setSelectedKey] = useState<'about' | 'terms' | 'privacy'>('about');
  const [pageTitle, setPageTitle] = useState('');
  const [pageSubtitle, setPageSubtitle] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    const unsub = subscribeStaticPages((pages) => {
      setPagesConfig(pages);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const activeData = pagesConfig[selectedKey];
    if (activeData) {
      setPageTitle(activeData.title || '');
      setPageSubtitle(activeData.subtitle || '');
      setPageContent(activeData.content || '');
    }
  }, [selectedKey, pagesConfig]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPages: StaticPagesConfig = {
      ...pagesConfig,
      [selectedKey]: {
        title: pageTitle.trim(),
        subtitle: pageSubtitle.trim(),
        content: pageContent,
        updatedAt: new Date().toISOString(),
      },
    };

    saveStaticPages(updatedPages);
    setPagesConfig(updatedPages);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-600" />
            정적 페이지 관리 (About Us / 이용약관 / 개인정보처리방침)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            소개, 이용약관, 개인정보처리방침 페이지의 내용 및 안내 문구를 관리자가 직접 수정하고 실시간 반영합니다.
          </p>
        </div>

        {isSaved && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>페이지가 저장되었습니다!</span>
          </div>
        )}
      </div>

      {/* Page Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setSelectedKey('about')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            selectedKey === 'about'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>소개 (About Us)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedKey('terms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            selectedKey === 'terms'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>이용약관 (Terms)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedKey('privacy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            selectedKey === 'privacy'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>개인정보처리방침 (Privacy)</span>
        </button>
      </div>

      {/* Page Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase">
            현재 수정 중: {selectedKey === 'about' ? '소개 페이지' : selectedKey === 'terms' ? '이용약관 페이지' : '개인정보처리방침 페이지'}
          </span>

          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isPreview ? '에디터로 돌아가기' : '미리보기'}</span>
          </button>
        </div>

        {!isPreview ? (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">페이지 메인 제목 *</label>
              <input
                type="text"
                required
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none w-full focus:border-emerald-600"
                placeholder="페이지 제목 입력..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">부제목 / 메타설명 문구</label>
              <input
                type="text"
                value={pageSubtitle}
                onChange={(e) => setPageSubtitle(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none w-full focus:border-emerald-600"
                placeholder="부제목 또는 설명 문구 입력..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">페이지 본문 내용 (마크다운 / 워드프레스 에디터) *</label>
              <ClassicEditor
                value={pageContent}
                onChange={setPageContent}
                minHeight="350px"
              />
            </div>
          </div>
        ) : (
          /* Live Preview Box */
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="text-center space-y-2 border-b border-slate-200 pb-4">
              <h1 className="text-2xl font-display font-bold text-slate-900">{pageTitle}</h1>
              {pageSubtitle && <p className="text-xs text-slate-600">{pageSubtitle}</p>}
            </div>
            <div className="whitespace-pre-wrap text-xs text-slate-800 leading-relaxed font-sans">
              {pageContent}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>페이지 내용 저장하기</span>
          </button>
        </div>
      </form>
    </div>
  );
};
