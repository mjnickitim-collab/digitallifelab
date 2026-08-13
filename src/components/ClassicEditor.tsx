import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Minus,
  Table,
  CheckSquare,
  Lightbulb,
  Eye,
  FileText,
  X,
  Check,
  ExternalLink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  DollarSign,
  Palette,
  Sparkles,
  Layout,
  RefreshCw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface ClassicEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  minHeight?: string;
}

export const ClassicEditor: React.FC<ClassicEditorProps> = ({
  value,
  onChange,
  minHeight = '480px',
}) => {
  // 'visual' (WYSIWYG), 'code' (Markdown/HTML raw), 'preview' (Live blog post view)
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'preview'>('visual');
  const editableRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Image Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageAlt, setImageAlt] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Convert raw markdown / value to visual HTML for contentEditable
  const markdownToHtml = (md: string): string => {
    if (!md) return '<p><br></p>';

    let html = md;

    // Convert Ad Slot Placeholders to visual badges
    html = html.replace(
      /\[AD_SLOT_TOP\]/gi,
      '<div data-ad-slot="post_top" contenteditable="false" class="my-4 p-3 bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl text-center text-xs font-bold text-amber-900 select-none cursor-pointer flex items-center justify-center gap-2"><span>📌 [구글 애드센스 본문 상단 광고 배치 영역]</span></div>'
    );
    html = html.replace(
      /\[AD_SLOT_MIDDLE\]|\[AD_SLOT\]|\[AD\]/gi,
      '<div data-ad-slot="post_middle" contenteditable="false" class="my-4 p-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-center text-xs font-bold text-blue-900 select-none cursor-pointer flex items-center justify-center gap-2"><span>📢 [구글 애드센스 본문 중간 광고 배치 영역]</span></div>'
    );
    html = html.replace(
      /\[AD_SLOT_BOTTOM\]/gi,
      '<div data-ad-slot="post_bottom" contenteditable="false" class="my-4 p-3 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl text-center text-xs font-bold text-indigo-900 select-none cursor-pointer flex items-center justify-center gap-2"><span>🎯 [구글 애드센스 본문 하단 광고 배치 영역]</span></div>'
    );

    // Convert Summary Box
    html = html.replace(
      /> \*\*핵심 요약\*\*\n> (.*)/gi,
      '<blockquote class="my-4 p-4 bg-blue-50/80 border-l-4 border-blue-600 rounded-r-xl text-slate-800 text-sm font-medium"><strong>💡 핵심 요약</strong><br/>$1</blockquote>'
    );

    // Convert Headings
    html = html.replace(/^### (.*$)/gim, '<h3 className="text-lg font-bold text-blue-900 mt-5 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 className="text-xl font-bold text-slate-900 mt-6 mb-3 border-b border-slate-200 pb-1">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 className="text-2xl font-bold text-slate-900 mt-6 mb-3">$1</h1>');

    // Convert Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert Markdown Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 underline font-semibold">$1</a>');

    // Convert Markdown Images: ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl my-4 max-h-80 w-full object-cover" />');

    // Convert Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-slate-400 pl-4 py-2 my-3 text-slate-700 bg-slate-50 italic">$1</blockquote>');

    // Convert line breaks to paragraphs/br if not HTML tag
    if (!html.includes('<p>') && !html.includes('<div>') && !html.includes('<h2')) {
      html = html.split('\n\n').map(p => p.trim() ? `<p className="mb-3">${p.replace(/\n/g, '<br/>')}</p>` : '').join('');
    }

    return html;
  };

  // Convert visual HTML back to clean string for state
  const htmlToMarkdownOrClean = (htmlStr: string): string => {
    let clean = htmlStr;

    // Convert visual ad badges back to short tags
    clean = clean.replace(/<div[^>]*data-ad-slot="post_top"[^>]*>[\s\S]*?<\/div>/gi, '\n\n[AD_SLOT_TOP]\n\n');
    clean = clean.replace(/<div[^>]*data-ad-slot="post_middle"[^>]*>[\s\S]*?<\/div>/gi, '\n\n[AD_SLOT_MIDDLE]\n\n');
    clean = clean.replace(/<div[^>]*data-ad-slot="post_bottom"[^>]*>[\s\S]*?<\/div>/gi, '\n\n[AD_SLOT_BOTTOM]\n\n');

    return clean;
  };

  // Sync state into contentEditable on mount or when switching to visual tab
  useEffect(() => {
    if (activeTab === 'visual' && editableRef.current) {
      const currentHtml = editableRef.current.innerHTML;
      const expectedHtml = markdownToHtml(value);
      if (!currentHtml || currentHtml === '<p><br></p>' || currentHtml !== expectedHtml) {
        editableRef.current.innerHTML = expectedHtml;
      }
    }
  }, [activeTab]);

  // Handle contentEditable user edits
  const handleVisualInput = () => {
    if (editableRef.current) {
      const innerHtml = editableRef.current.innerHTML;
      const cleaned = htmlToMarkdownOrClean(innerHtml);
      onChange(cleaned);
    }
  };

  // ExecCommand helper for visual WYSIWYG editing
  const execCmd = (command: string, valueArg: string = '') => {
    if (activeTab !== 'visual') {
      setActiveTab('visual');
      setTimeout(() => {
        document.execCommand(command, false, valueArg);
        handleVisualInput();
      }, 50);
      return;
    }
    if (editableRef.current) {
      editableRef.current.focus();
    }
    document.execCommand(command, false, valueArg);
    handleVisualInput();
  };

  // Format Block helper (e.g. H2, H3, P, Blockquote)
  const formatBlock = (tag: string) => {
    execCmd('formatBlock', tag);
  };

  // Insert Ad Banner Badge directly in visual editor
  const insertAdSlot = (slotType: 'post_top' | 'post_middle' | 'post_bottom') => {
    const slotLabels = {
      post_top: '📌 [구글 애드센스 본문 상단 광고 배치 영역]',
      post_middle: '📢 [구글 애드센스 본문 중간 광고 배치 영역]',
      post_bottom: '🎯 [구글 애드센스 본문 하단 광고 배치 영역]',
    };

    const slotBadgeHtml = `<div data-ad-slot="${slotType}" contenteditable="false" class="my-4 p-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-center text-xs font-bold text-blue-900 select-none cursor-pointer flex items-center justify-center gap-2"><span>${slotLabels[slotType]}</span></div><p><br></p>`;

    if (activeTab === 'visual') {
      execCmd('insertHTML', slotBadgeHtml);
    } else {
      const tag = `\n\n[AD_SLOT_${slotType.toUpperCase().replace('POST_', '')}]\n\n`;
      onChange(value + tag);
    }
  };

  // Insert Callout Summary Box
  const insertCalloutBox = () => {
    const calloutHtml = `<blockquote class="my-4 p-4 bg-blue-50/80 border-l-4 border-blue-600 rounded-r-xl text-slate-800 text-sm font-medium"><strong>💡 핵심 요약</strong><br/>이 글의 핵심 내용을 여기에 작성하세요.</blockquote><p><br></p>`;
    if (activeTab === 'visual') {
      execCmd('insertHTML', calloutHtml);
    } else {
      onChange(value + '\n\n> **핵심 요약**\n> 이 글의 핵심 내용을 여기에 작성하세요.\n\n');
    }
  };

  // Open Link Modal
  const openLinkModal = () => {
    let selected = '';
    const sel = window.getSelection();
    if (sel && sel.toString()) {
      selected = sel.toString();
    }
    setLinkText(selected || '공식 웹사이트 방문하기');
    setLinkUrl('https://');
    setIsLinkModalOpen(true);
  };

  // Apply Link
  const handleApplyLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    const textToInsert = linkText.trim() || '외부 링크';
    const cleanUrl = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;

    if (activeTab === 'visual') {
      const linkHtml = `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold hover:text-blue-800">${textToInsert}</a>`;
      execCmd('insertHTML', linkHtml);
    } else {
      const mdLink = `[${textToInsert}](${cleanUrl})`;
      onChange(value + ' ' + mdLink);
    }

    setIsLinkModalOpen(false);
    setLinkText('');
    setLinkUrl('');
  };

  // Apply Image
  const handleApplyImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    const alt = imageAlt.trim() || '';
    const cleanUrl = imageUrl.trim();

    if (activeTab === 'visual') {
      const imgHtml = `<img src="${cleanUrl}" alt="${alt}" class="rounded-2xl max-h-96 my-4 w-full object-cover shadow-sm" /><p><br></p>`;
      execCmd('insertHTML', imgHtml);
    } else {
      const mdImg = `![${alt}](${cleanUrl})`;
      onChange(value + '\n\n' + mdImg + '\n\n');
    }

    setIsImageModalOpen(false);
    setImageAlt('');
    setImageUrl('');
  };

  return (
    <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Top Header & Toolbar Area */}
      <div className="bg-slate-100 border-b border-slate-300 p-2.5 space-y-2">
        {/* Row 1: Primary Visual Controls & View Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
          {/* Main Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1">
            {/* Heading Level Selector */}
            <select
              onChange={(e) => {
                const tag = e.target.value;
                if (tag) {
                  formatBlock(tag);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              <option value="" disabled>
                제목 / 본문 스타일...
              </option>
              <option value="<h2>">제목 2 (H2)</option>
              <option value="<h3>">제목 3 (H3)</option>
              <option value="<h4>">제목 4 (H4)</option>
              <option value="<p>">일반 본문 (Paragraph)</option>
              <option value="<blockquote>">인용 상자 (Quote)</option>
            </select>

            <div className="h-4 w-[1px] bg-slate-300 mx-1" />

            {/* Bold */}
            <button
              type="button"
              onClick={() => execCmd('bold')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="굵게 (Bold)"
            >
              <Bold className="w-4 h-4" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => execCmd('italic')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="기울임 (Italic)"
            >
              <Italic className="w-4 h-4" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => execCmd('underline')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="밑줄 (Underline)"
            >
              <Underline className="w-4 h-4" />
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onClick={() => execCmd('strikeThrough')}
              className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="취소선"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            {/* Highlight yellow */}
            <button
              type="button"
              onClick={() => execCmd('hiliteColor', '#fef08a')}
              className="px-2 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-md text-xs font-bold transition-colors cursor-pointer"
              title="형광펜 강조"
            >
              형광펜
            </button>

            <div className="h-4 w-[1px] bg-slate-300 mx-1" />

            {/* Alignment */}
            <button
              type="button"
              onClick={() => execCmd('justifyLeft')}
              className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="왼쪽 정렬"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('justifyCenter')}
              className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="가운데 정렬"
            >
              <AlignCenter className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-300 mx-1" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="글머리 기호 목록"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertOrderedList')}
              className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="번호 목록"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-300 mx-1" />

            {/* Link & Image */}
            <button
              type="button"
              onClick={openLinkModal}
              className="px-2.5 py-1 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              title="외부 링크 삽입"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>외부 링크</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="본문 이미지 삽입"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Clear formatting */}
            <button
              type="button"
              onClick={() => execCmd('removeFormat')}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="서식 지우기"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Tabs: Visual vs Code vs Preview */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'visual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>비주얼 스마트 에디터 (추천)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'code'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>코드/태그 직접 편집</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'preview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>실제 게재 미리보기</span>
            </button>
          </div>
        </div>

        {/* Row 2: Blog Monetization & Ad Insertion Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <span className="text-[11px] font-mono text-slate-500 font-bold uppercase flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
              수익화 광고 삽입:
            </span>

            <button
              type="button"
              onClick={() => insertAdSlot('post_middle')}
              className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>📌 본문 중간 광고 배치</span>
            </button>

            <button
              type="button"
              onClick={() => insertAdSlot('post_top')}
              className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>📢 본문 상단 광고</span>
            </button>

            <button
              type="button"
              onClick={() => insertAdSlot('post_bottom')}
              className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>🎯 본문 하단 광고</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={insertCalloutBox}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>핵심 요약 박스</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body Container */}
      <div className="relative">
        {/* 1. VISUAL WYSIWYG MODE (Default) */}
        {activeTab === 'visual' && (
          <div className="p-6 bg-white min-h-[480px]">
            <div
              ref={editableRef}
              contentEditable
              onInput={handleVisualInput}
              style={{ minHeight }}
              className="outline-none prose prose-slate max-w-none text-slate-900 leading-relaxed text-sm sm:text-base focus:ring-0 font-sans"
            />
          </div>
        )}

        {/* 2. RAW CODE MODE */}
        {activeTab === 'code' && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ minHeight }}
            placeholder="마크다운 또는 HTML 코드를 직접 편집하세요..."
            className="w-full p-5 font-mono text-xs leading-relaxed text-slate-900 bg-slate-950/5 text-slate-900 outline-none resize-y border-none"
          />
        )}

        {/* 3. PREVIEW MODE */}
        {activeTab === 'preview' && (
          <div
            style={{ minHeight }}
            className="p-8 bg-slate-50 overflow-y-auto prose prose-slate max-w-none text-sm sm:text-base leading-relaxed"
          >
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }) => (
                  <a
                    className="text-blue-600 font-semibold underline hover:text-blue-800 transition-colors inline-flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-slate-900 bg-amber-50/80 px-1 py-0.5 rounded" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-blue-600 pl-4 py-3 my-4 bg-blue-50/60 rounded-r-xl text-slate-800 font-medium" {...props} />
                ),
                div: ({ node, className, children, ...props }: any) => {
                  if (props['data-ad-slot']) {
                    return (
                      <div className="my-6 p-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl text-center text-xs font-bold text-amber-900 flex items-center justify-center gap-2 shadow-xs">
                        <DollarSign className="w-4 h-4 text-amber-600" />
                        <span>[실제 게재 시 여기에 구글 애드센스 광고가 자동 배너 노출됩니다]</span>
                      </div>
                    );
                  }
                  return <div className={className} {...props}>{children}</div>;
                },
              }}
            >
              {value}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Insert External Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold font-display text-base">
                <LinkIcon className="w-5 h-5" />
                <span>외부 링크 연결하기</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLink} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700">링크 표시 문구 (Anchor Text)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 삼성 헬스 공식 홈페이지"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700">연결할 URL 주소</label>
                <input
                  type="text"
                  required
                  placeholder="https://www.samsung.com/..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                />
                <p className="text-[11px] text-slate-500 pt-0.5">
                  클릭 시 안전하게 새 탭(`target="_blank"`)에서 연결됩니다.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>링크 삽입</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insert Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold font-display text-base">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <span>본문 이미지 삽입</span>
              </div>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyImage} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700">이미지 설명 (Alt - 코드 전용)</label>
                <input
                  type="text"
                  placeholder="예: 스마트폰 수면 모드 설정 화면"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
                <p className="text-[11px] text-slate-500">
                  alt 속성은 외부 화면에 문자로 노출되지 않고 검색엔진/접근성 코드용으로만 사용됩니다.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-700">이미지 URL 주소</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>이미지 추가</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
