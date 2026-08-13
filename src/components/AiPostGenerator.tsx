import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Check,
  RefreshCw,
  Wand2,
  BookOpen,
  Star,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  FileEdit,
  Grid,
} from 'lucide-react';
import { BlogPost, SecretKeysConfig } from '../types';
import { CATEGORIES } from '../data/samplePosts';
import { PRESET_TOPICS, PresetTopic } from '../data/presetTopics';

interface AiPostGeneratorProps {
  secrets: SecretKeysConfig;
  posts?: BlogPost[];
  onPostGenerated: (postData: Omit<BlogPost, 'id' | 'views' | 'likes'>) => void;
}

export const AiPostGenerator: React.FC<AiPostGeneratorProps> = ({
  secrets,
  posts = [],
  onPostGenerated,
}) => {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('건강·웰빙');
  const [tone, setTone] = useState('친근하고 과장되지 않은 실용적 존댓말');
  const [wordCount, setWordCount] = useState(3000);

  // Default is Draft (isDraft = true)
  const [isDraft, setIsDraft] = useState(true);

  // Preset topics states
  const [showPresets, setShowPresets] = useState(true);
  const [selectedPresetTab, setSelectedPresetTab] = useState<string>('all');
  const [presetSearch, setPresetSearch] = useState('');

  // Track topic generation usage counts
  const [usageMap, setUsageMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('ai_topic_usage_counts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Unsplash image state & modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [imageList, setImageList] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200'
  );
  const [imageCaption, setImageCaption] = useState('스마트폰 디지털 라이프 스타일');

  // Helper to count existing published posts matching a topic
  const getMatchingPostCount = (topicTitle: string): number => {
    if (!posts || posts.length === 0) return 0;
    const cleanTopic = (topicTitle || '').trim().toLowerCase();
    if (!cleanTopic) return 0;

    return posts.filter((p) => {
      const pTitle = (p?.title || '').trim().toLowerCase();
      if (!pTitle) return false;

      // Exact match or full topic phrase match
      if (pTitle === cleanTopic) return true;
      if (cleanTopic.length >= 8 && pTitle.includes(cleanTopic)) return true;

      // Exact keyword or tag match
      if (Array.isArray(p.keywords) && p.keywords.some((k) => (k || '').trim().toLowerCase() === cleanTopic)) {
        return true;
      }

      return false;
    }).length;
  };

  const getTopicUsageCount = (topicTitle: string): number => {
    const localCount = usageMap[topicTitle.trim()] || 0;
    const postCount = getMatchingPostCount(topicTitle);
    return Math.max(localCount, postCount);
  };

  // Filter & Sort preset topics (Pilot topics MUST come FIRST in each category)
  const filteredPresets = useMemo(() => {
    const list = PRESET_TOPICS.filter((item) => {
      // Category filter
      if (selectedPresetTab === 'pilot') {
        if (!item.isPilot) return false;
      } else if (selectedPresetTab !== 'all') {
        if (item.category !== selectedPresetTab) return false;
      }
      // Search query filter
      if (presetSearch.trim()) {
        const q = presetSearch.trim().toLowerCase();
        return (item.title || '').toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q);
      }
      return true;
    });

    // Gather Pilot topics (isPilot: true) first at the top of each view
    return list.sort((a, b) => {
      if (a.isPilot && !b.isPilot) return -1;
      if (!a.isPilot && b.isPilot) return 1;
      return a.id - b.id;
    });
  }, [selectedPresetTab, presetSearch]);

  const handleSelectPreset = (preset: PresetTopic) => {
    setTopic(preset.title);
    setCategory(preset.category);
    setImageSearchQuery(preset.title);
  };

  const handleSearchUnsplash = async (queryParam?: string) => {
    setIsSearchingImages(true);
    try {
      const queryToSearch = queryParam || imageSearchQuery || topic || category;
      const res = await fetch(
        `/api/search-unsplash?query=${encodeURIComponent(queryToSearch)}&accessKey=${secrets.unsplashAccessKey || ''}`
      );
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.warn('Unsplash response not JSON:', text.slice(0, 100));
      }
      if (data && Array.isArray(data.images) && data.images.length > 0) {
        setImageList(data.images);
      }
    } catch (e) {
      console.error('Unsplash search error:', e);
    } finally {
      setIsSearchingImages(false);
    }
  };

  const handleOpenImageModal = () => {
    setIsImageModalOpen(true);
    const initialQuery = topic || category;
    setImageSearchQuery(initialQuery);
    handleSearchUnsplash(initialQuery);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setErrorMsg('');

    const currentUsage = getTopicUsageCount(topic);

    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          category,
          tone,
          targetWordCount: wordCount,
          apiKey: secrets.geminiApiKey,
          publicationCount: currentUsage,
        }),
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        if (responseText.includes('The page') || responseText.includes('<html>') || responseText.includes('504') || responseText.includes('502')) {
          throw new Error('서버 게이트웨이 처리 시간이 초과되었습니다. Gemini API 키를 확인하시거나 잠시 후 다시 시도해 주세요.');
        }
        throw new Error(`올바르지 않은 서버 응답입니다: ${responseText.slice(0, 80)}`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || '글 생성에 실패했습니다.');
      }

      // Save updated usage count
      const newCount = currentUsage + 1;
      const updatedMap = { ...usageMap, [topic.trim()]: newCount };
      setUsageMap(updatedMap);
      try {
        localStorage.setItem('ai_topic_usage_counts', JSON.stringify(updatedMap));
      } catch (err) {
        console.error('Failed to persist topic usage count:', err);
      }

      const art = data.article || {};
      const slug = art.slug || ((art.title || topic || '')
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, '-')
        .replace(/(^-|-$)/g, '')) || `post-${Date.now()}`;

      onPostGenerated({
        slug,
        title: art.title || topic,
        seoTitle: art.seoTitle || art.title || topic,
        subtitle: art.subtitle || '',
        metaDescription: art.metaDescription || art.excerpt || '',
        excerpt: art.excerpt || `${art.title || topic}에 관한 디지털생활연구소 실용 가이드입니다.`,
        content: art.content || '',
        category: art.category || category,
        tags: art.tags || ['디지털생활연구소', '실용가이드'],
        keywords: art.keywords || [topic],
        livingProblem: art.livingProblem || '',
        digitalTool: art.digitalTool || '',
        testEnvironment: art.testEnvironment || '',
        toc: art.toc || [],
        faq: art.faq || [],
        verificationChecklist: art.verificationChecklist || [],
        readTimeMinutes: 5,
        published: !isDraft, // If isDraft is true -> published is false
        featured: false,
        coverImage: selectedImage,
        imageCaption: imageCaption,
        author: {
          name: 'Digital life lab',
          avatar: '',
          role: '디지털생활연구소',
        },
        publishedAt: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      setErrorMsg(err.message || '글 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">
              AI 블로그 자동 발행 엔진 (Gemini 3.6 Flash)
            </h2>
            <p className="text-xs text-slate-400">
              120개 검증 주제 중에서 선택하거나 직접 주제를 입력하면 AI가 자동으로 완벽한 칼럼을 작성합니다.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Article Title Input & Categorized Topic Recommendations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-medium text-slate-300">
              Article Title / 글 주제 키워드 *
            </label>
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>추천 주제 120개 목록 {showPresets ? '접기' : '열기'}</span>
              {showPresets ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <input
            type="text"
            placeholder="직접 입력하거나 아래 카테고리별 추천 주제 중 하나를 선택하세요"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white outline-none w-full shadow-inner"
          />

          {/* Preset Topics Recommendation Box */}
          {showPresets && (
            <div className="mt-3 bg-slate-950 border border-slate-800/90 rounded-2xl p-4 space-y-3">
              {/* Category Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setSelectedPresetTab('all')}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                      selectedPresetTab === 'all'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    전체 (120)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPresetTab('pilot')}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                      selectedPresetTab === 'pilot'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-amber-400 hover:bg-amber-950/40'
                    }`}
                  >
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ★ 파일럿 (30)
                  </button>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedPresetTab(c.name)}
                      className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                        selectedPresetTab === c.name
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                {/* Preset Search */}
                <div className="relative flex items-center shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5" />
                  <input
                    type="text"
                    placeholder="주제 검색..."
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 outline-none focus:border-blue-500 w-full sm:w-36"
                  />
                </div>
              </div>

              {/* Topics Grid */}
              <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                {filteredPresets.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    검색 조건에 맞는 블로그 주제가 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {filteredPresets.map((item) => {
                      const isSelected = topic === item.title;
                      const usageCount = getTopicUsageCount(item.title);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectPreset(item)}
                          className={`text-left px-3 py-2 rounded-xl text-xs transition-all border flex items-start gap-2 group cursor-pointer ${
                            isSelected
                              ? 'bg-blue-950/80 border-blue-500/80 text-white font-semibold shadow-xs'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-mono text-[10px] text-slate-500 shrink-0 mt-0.5">
                            #{String(item.id).padStart(3, '0')}
                          </span>
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.isPilot && (
                                <span className="bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-500/30 flex items-center gap-0.5">
                                  ★ 파일럿
                                </span>
                              )}
                              {usageCount > 0 && (
                                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  발행기록 ({usageCount}회)
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-slate-400">
                                {item.category}
                              </span>
                            </div>
                            <p className="line-clamp-2 leading-relaxed">{item.title}</p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Category, Tone & Target Word Count (Reading Time Deleted!) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono font-medium text-slate-300">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none w-full cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono font-medium text-slate-300">글 어조 / 스타일</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none w-full cursor-pointer"
            >
              <option value="친근하고 과장되지 않은 실용적 존댓말">친근한 실용적 존댓말 (추천)</option>
              <option value="통찰력 있고 분석적인 모던 스타일">통찰력 & 분석적 스타일</option>
              <option value="기술적이고 체계적인 딥다이브 가이드">기술 딥다이브 가이드</option>
              <option value="철학적이고 생각을 자극하는 에세이">철학적 에세이</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono font-medium text-slate-300">목표 분량 (SEO/AdSense 최적화)</label>
            <select
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none w-full cursor-pointer"
            >
              <option value={2500}>표준 SEO 실용 가이드 (2,500~3,000자)</option>
              <option value={3500}>고품질 딥다이브 칼럼 (3,500~4,000자)</option>
            </select>
          </div>
        </div>

        {/* Cover Photo Sourcing with Unsplash Modal Trigger */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-mono font-bold uppercase text-slate-200">
                Cover Image (Unsplash 연동)
              </h4>
            </div>
            <button
              type="button"
              onClick={handleOpenImageModal}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>이미지 고르기 (Unsplash 모달)</span>
            </button>
          </div>

          {/* Selected Cover Image Preview */}
          <div className="flex items-center gap-4">
            <img
              src={selectedImage}
              alt="Cover Preview"
              className="w-24 h-16 object-cover rounded-lg border border-slate-800 shrink-0 bg-slate-900 shadow-sm"
            />
            <div className="space-y-1.5 w-full">
              <input
                type="text"
                placeholder="선택된 이미지 URL"
                value={selectedImage}
                onChange={(e) => setSelectedImage(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 w-full font-mono outline-none"
              />
              <input
                type="text"
                placeholder="이미지 캡션 설명"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-[11px] text-slate-400 w-full outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card Excerpt Auto-Generation Notice & Publishing Status Settings */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs text-slate-300">
              <strong className="text-white">Card Excerpt Summary</strong>는 글 생성 시 AI가 요약을 자동 생성합니다.
            </span>
          </div>

          {/* Draft Selection Checkbox (Default is Draft = true) */}
          <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer shrink-0 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
            <span>임시 저장(Draft) 상태로 생성</span>
            <span className="text-[10px] font-normal text-slate-400">
              ({isDraft ? '임시저장함 보관' : '즉시 공개 발행'})
            </span>
          </label>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        {/* Generate Trigger */}
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Gemini AI가 한국어 칼럼 및 요약을 작성하는 중입니다...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>
                {isDraft ? 'AI 한국어 칼럼 생성 및 임시 저장 (Draft)' : 'AI 한국어 칼럼 생성 및 즉시 발행'}
              </span>
            </>
          )}
        </button>
      </form>

      {/* Unsplash Image Choice Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Unsplash 대표 이미지 선택</h3>
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input inside modal */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="검색 키워드 입력 (예: 스마트폰 수면 측정, 가계부, 여행)"
                  value={imageSearchQuery}
                  onChange={(e) => setImageSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUnsplash()}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-blue-500 w-full"
                />
              </div>
              <button
                onClick={() => handleSearchUnsplash()}
                disabled={isSearchingImages}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {isSearchingImages ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>검색</span>
              </button>
            </div>

            {/* Images Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {isSearchingImages ? (
                <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  <span>Unsplash에서 고화질 대표 이미지를 검색하는 중입니다...</span>
                </div>
              ) : imageList.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500">
                  이미지 결과가 없습니다. 위 검색창에서 다른 키워드로 검색해 보세요.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {imageList.map((img) => {
                    const isSelected = selectedImage === img.url;
                    return (
                      <div
                        key={img.id}
                        onClick={() => {
                          setSelectedImage(img.url);
                          setImageCaption(img.caption);
                          setIsImageModalOpen(false);
                        }}
                        className={`group relative h-32 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/50 scale-95 shadow-lg'
                            : 'border-slate-800 hover:border-slate-600 hover:scale-[1.02]'
                        }`}
                      >
                        <img src={img.thumb} alt={img.caption} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                          <p className="text-[10px] text-white line-clamp-2 font-medium">{img.caption}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
              <span>이미지를 클릭하면 선택되어 적용됩니다.</span>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

