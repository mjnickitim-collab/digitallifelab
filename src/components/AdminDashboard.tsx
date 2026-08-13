import React, { useState } from 'react';
import {
  FileText,
  PlusCircle,
  Sparkles,
  Rss,
  KeyRound,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Star,
  LogOut,
  ArrowLeft,
  Save,
  Clock,
  Tag,
  Image as ImageIcon,
  Search,
  Loader2,
  X,
  Mail,
  Megaphone,
} from 'lucide-react';
import { BlogPost, SecretKeysConfig } from '../types';
import { CATEGORIES } from '../data/samplePosts';
import { AiPostGenerator } from './AiPostGenerator';
import { SitemapManager } from './SitemapManager';
import { SecretKeysSettings } from './SecretKeysSettings';
import { NewsletterManager } from './NewsletterManager';
import { AdManager } from './AdManager';
import { ClassicEditor } from './ClassicEditor';
import { PageManager } from './PageManager';

interface AdminDashboardProps {
  posts: BlogPost[];
  secrets: SecretKeysConfig;
  onExitAdmin: () => void;
  onCreatePost: (postData: Omit<BlogPost, 'id' | 'views' | 'likes'>) => void;
  onUpdatePost: (id: string, updates: Partial<BlogPost>) => void;
  onDeletePost: (id: string) => void;
  onUpdateSecrets: (secrets: SecretKeysConfig) => void;
}

const PRESET_STOCK_IMAGES = [
  { name: '스마트폰/디지털', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=1200' },
  { name: '명상/호흡/웰빙', url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=1200' },
  { name: '수면/휴식', url: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&q=80&w=1200' },
  { name: '생산성/노트', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200' },
  { name: '재테크/금융', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=1200' },
  { name: '가족/일상', url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=1200' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  posts,
  secrets,
  onExitAdmin,
  onCreatePost,
  onUpdatePost,
  onDeletePost,
  onUpdateSecrets,
}) => {
  const [activeTab, setActiveTab] = useState<'manager' | 'manual' | 'ai' | 'newsletter' | 'ads' | 'pages' | 'sitemap' | 'secrets'>('manager');

  // Manual Editor State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualSubtitle, setManualSubtitle] = useState('');
  const [manualExcerpt, setManualExcerpt] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualCategory, setManualCategory] = useState('Tech & AI');
  const [manualTags, setManualTags] = useState('AI, Technology, Design');
  const [manualReadTime, setManualReadTime] = useState(5);
  const [manualCoverImage, setManualCoverImage] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200'
  );
  const [manualPublished, setManualPublished] = useState(true);
  const [manualFeatured, setManualFeatured] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Unsplash Image Modal state for Manual Editor
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [imageList, setImageList] = useState<any[]>([]);

  const handleSearchUnsplash = async (queryParam?: string) => {
    setIsSearchingImages(true);
    try {
      const q = queryParam || imageSearchQuery || manualTitle || manualCategory || 'technology';
      const res = await fetch(
        `/api/search-unsplash?query=${encodeURIComponent(q)}&accessKey=${secrets.unsplashAccessKey || ''}`
      );
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (err) {
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

  const startNewManualPost = () => {
    setEditingPostId(null);
    setManualTitle('');
    setManualSubtitle('');
    setManualExcerpt('');
    setManualContent('# Welcome to your new essay\n\nStart writing your thoughts here...');
    setManualCategory('Tech & AI');
    setManualTags('Writing, Technology');
    setManualReadTime(5);
    setManualCoverImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200');
    setManualPublished(true);
    setManualFeatured(false);
    setActiveTab('manual');
  };

  const startEditPost = (post: BlogPost) => {
    setEditingPostId(post.id);
    setManualTitle(post.title);
    setManualSubtitle(post.subtitle || '');
    setManualExcerpt(post.excerpt);
    setManualContent(post.content);
    setManualCategory(post.category);
    setManualTags(post.tags ? post.tags.join(', ') : '');
    setManualReadTime(post.readTimeMinutes);
    setManualCoverImage(post.coverImage);
    setManualPublished(post.published);
    setManualFeatured(post.featured || false);
    setActiveTab('manual');
  };

  const handleSaveManualPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) return;

    const slug = (manualTitle || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const tagsArray = manualTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const postPayload = {
      slug,
      title: manualTitle.trim(),
      subtitle: manualSubtitle.trim(),
      excerpt: manualExcerpt.trim() || manualTitle.trim(),
      content: manualContent,
      category: manualCategory,
      tags: tagsArray,
      readTimeMinutes: Number(manualReadTime) || 5,
      published: manualPublished,
      featured: manualFeatured,
      coverImage: manualCoverImage,
      author: {
        name: 'Digital life lab',
        avatar: '',
        role: '디지털생활연구소',
      },
      publishedAt: new Date().toISOString().split('T')[0],
    };

    if (editingPostId) {
      onUpdatePost(editingPostId, postPayload);
    } else {
      onCreatePost(postPayload);
    }

    setActiveTab('manager');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Admin Control Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Authenticated Admin Mode
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            ModaBlog CMS Shell
          </h1>
          <p className="text-xs text-slate-400">
            Publish articles, generate AI drafts, update sitemap, and configure API secrets.
          </p>
        </div>

        <button
          onClick={onExitAdmin}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit Admin Mode
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('manager')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'manager'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Articles ({posts.length})</span>
        </button>

        <button
          onClick={startNewManualPost}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-blue-500" />
          <span>Write Post</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI Generator (Gemini)</span>
        </button>

        <button
          onClick={() => setActiveTab('newsletter')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'newsletter'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-4 h-4 text-emerald-400" />
          <span>뉴스레터 구독자 & 발행</span>
        </button>

        <button
          onClick={() => setActiveTab('ads')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ads'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-500" />
          <span>애드센스 & 광고 관리</span>
        </button>

        <button
          onClick={() => setActiveTab('pages')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'pages'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-500" />
          <span>정적 페이지 편집 (소개/약관)</span>
        </button>

        <button
          onClick={() => setActiveTab('sitemap')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'sitemap'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Rss className="w-4 h-4 text-emerald-500" />
          <span>Sitemap.xml</span>
        </button>

        <button
          onClick={() => setActiveTab('secrets')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'secrets'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>API Secrets & Keys</span>
        </button>
      </div>

      {/* Tab Content 1: Articles Manager */}
      {activeTab === 'manager' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-slate-900">
              Published & Draft Articles ({posts.length})
            </h2>
            <button
              onClick={startNewManualPost}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              New Article
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="p-4">Article</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Featured</th>
                    <th className="p-4">Views / Likes</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {posts.map((post, idx) => (
                    <tr key={post.id || `post-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={post.coverImage}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-slate-200 shrink-0"
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 line-clamp-1">{post.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">{post.publishedAt}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-md text-[11px]">
                          {post.category}
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => onUpdatePost(post.id, { published: !post.published })}
                          className={`cursor-pointer px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            post.published
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {post.published ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {post.published ? 'Published' : 'Draft'}
                        </button>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => onUpdatePost(post.id, { featured: !post.featured })}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            post.featured
                              ? 'bg-amber-50 text-amber-600 border-amber-300'
                              : 'bg-slate-50 text-slate-300 border-slate-200 hover:text-slate-500'
                          }`}
                          title="Toggle Featured Essay on Hero Home"
                        >
                          <Star className={`w-4 h-4 ${post.featured ? 'fill-amber-500' : ''}`} />
                        </button>
                      </td>

                      <td className="p-4 font-mono text-slate-500 text-[11px]">
                        👁 {post.views} / ❤️ {post.likes}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEditPost(post)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Essay"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${post.title}"?`)) {
                                onDeletePost(post.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Essay"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Write Manual Post */}
      {activeTab === 'manual' && (
        <form onSubmit={handleSaveManualPost} className="space-y-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-display font-bold text-slate-900">
              {editingPostId ? 'Edit Article Draft' : 'Write & Format Article (Markdown)'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {isPreviewMode ? 'Back to Editor' : 'Live Markdown Preview'}
              </button>
            </div>
          </div>

          {!isPreviewMode ? (
            <div className="space-y-6">
              {/* Title & Subtitle */}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Article Title *"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="text-xl sm:text-2xl font-display font-bold text-slate-900 border-b border-slate-200 pb-2 outline-none w-full focus:border-blue-600"
                />
                <input
                  type="text"
                  placeholder="Subtitle or Lead Paragraph..."
                  value={manualSubtitle}
                  onChange={(e) => setManualSubtitle(e.target.value)}
                  className="text-sm font-medium text-slate-600 border-b border-slate-200 pb-2 outline-none w-full focus:border-blue-600"
                />
              </div>

              {/* Category & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-600">Category</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none w-full cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-600">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="디지털생활연구소, 실용가이드"
                    value={manualTags}
                    onChange={(e) => setManualTags(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none w-full"
                  />
                </div>
              </div>

              {/* Cover Image URL & Card Excerpt Summary */}
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-mono font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      Cover Image (커버 이미지)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsImageModalOpen(true);
                        const q = manualTitle || manualCategory;
                        setImageSearchQuery(q);
                        handleSearchUnsplash(q);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      이미지 검색 / 선택 (Unsplash)
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                    <div className="w-full sm:w-36 h-24 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                      <img src={manualCoverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-full space-y-1">
                      <span className="text-[11px] font-mono text-slate-500">Image URL:</span>
                      <input
                        type="text"
                        value={manualCoverImage}
                        onChange={(e) => setManualCoverImage(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none w-full font-mono"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-slate-600">Card Excerpt Summary (자동 요약)</label>
                  <input
                    type="text"
                    placeholder="블로그 카드용 2문장 요약..."
                    value={manualExcerpt}
                    onChange={(e) => setManualExcerpt(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none w-full"
                  />
                </div>
              </div>

              {/* WordPress Classic Style Editor Area */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5">
                    <Edit className="w-4 h-4 text-blue-600" />
                    Article Body Content (워드프레스 에디터 편집) *
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    상단 툴바의 '외부 링크' 버튼을 눌러 서식을 손쉽게 삽입할 수 있습니다
                  </span>
                </div>
                <ClassicEditor
                  value={manualContent}
                  onChange={setManualContent}
                  minHeight="420px"
                />
              </div>

              {/* Status toggles & Save */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-6">
                  {/* Draft Checkbox - default is draft (manualPublished === false) */}
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!manualPublished}
                      onChange={(e) => setManualPublished(!e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>임시 저장(Draft) 상태로 저장</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({!manualPublished ? '임시저장' : '즉시 발행'})
                    </span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualFeatured}
                      onChange={(e) => setManualFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    Set as Hero Featured Essay
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingPostId ? 'Update Essay' : 'Publish Essay'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Preview */
            <div className="prose max-w-none p-6 bg-slate-50 border border-slate-200 rounded-2xl">
              <h1 className="text-3xl font-bold font-display">{manualTitle || 'Untitled Essay'}</h1>
              {manualSubtitle && <p className="text-base text-slate-600 italic">{manualSubtitle}</p>}
              <hr className="my-4" />
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{manualContent}</div>
            </div>
          )}
        </form>
      )}

      {/* Tab Content 3: AI Assistant */}
      {activeTab === 'ai' && (
        <AiPostGenerator
          secrets={secrets}
          posts={posts}
          onPostGenerated={(newPostData) => {
            onCreatePost(newPostData);
            setActiveTab('manager');
          }}
        />
      )}

      {/* Tab Content 4: Newsletter Subscriber & Issue Management */}
      {activeTab === 'newsletter' && <NewsletterManager posts={posts} />}

      {/* Tab Content 5: AdSense & Banner Management */}
      {activeTab === 'ads' && <AdManager />}

      {/* Tab Content 6: Static Page Manager (About, Terms, Privacy) */}
      {activeTab === 'pages' && <PageManager />}

      {/* Tab Content 7: Sitemap & SEO */}
      {activeTab === 'sitemap' && <SitemapManager posts={posts} />}

      {/* Tab Content 5: Secret Keys Settings */}
      {activeTab === 'secrets' && (
        <SecretKeysSettings secrets={secrets} onUpdateSecrets={onUpdateSecrets} />
      )}

      {/* Unsplash Cover Image Selection Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                커버 이미지 선택 (Unsplash & 추천 프리셋)
              </h3>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="검색어 입력 (예: 스마트폰, 명상, 힐링, 수면, 재테크...)"
                value={imageSearchQuery}
                onChange={(e) => setImageSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchUnsplash();
                  }
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none w-full focus:border-blue-600"
              />
              <button
                type="button"
                onClick={() => handleSearchUnsplash()}
                disabled={isSearchingImages}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {isSearchingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                검색
              </button>
            </div>

            {/* Quick Curated Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-500 font-bold uppercase">추천 이미지 카테고리</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_STOCK_IMAGES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setManualCoverImage(item.url);
                      setIsImageModalOpen(false);
                    }}
                    className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Unsplash Search Grid Results */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-mono text-slate-500 font-bold uppercase">Unsplash 검색 결과</span>
              {isSearchingImages ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <p className="text-xs">이미지 불러오는 중...</p>
                </div>
              ) : imageList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                  {imageList.map((img, i) => {
                    const imgUrl = img.url || img.urls?.regular || img.urls?.small || '';
                    const thumbUrl = img.thumb || img.urls?.small || img.urls?.regular || imgUrl;
                    const isSelected = manualCoverImage === imgUrl;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (imgUrl) {
                            setManualCoverImage(imgUrl);
                          }
                          setIsImageModalOpen(false);
                        }}
                        className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected ? 'border-blue-600 shadow-md' : 'border-transparent hover:border-blue-300'
                        }`}
                      >
                        <img src={thumbUrl} alt={img.caption || img.alt_description || ''} className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold bg-blue-600 px-2 py-1 rounded-md">선택하기</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  검색어를 입력하고 검색 버튼을 누르면 고화질 이미지를 선택할 수 있습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
