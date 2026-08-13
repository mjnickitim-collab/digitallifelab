import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Eye,
  Heart,
  Share2,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { BlogPost } from '../types';
import {
  incrementPostViews,
  incrementPostLikes,
} from '../services/storage';
import { AdBanner } from './AdBanner';

interface PostDetailProps {
  post: BlogPost;
  allPosts: BlogPost[];
  onBack: () => void;
  onSelectPost: (post: BlogPost) => void;
}

export const PostDetail: React.FC<PostDetailProps> = ({
  post,
  allPosts,
  onBack,
  onSelectPost,
}) => {
  const [likes, setLikes] = useState(post.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Guard ref to prevent infinite view increment loop on real-time updates
  const viewedPostIdRef = useRef<string | null>(null);

  // Increment views once per unique post ID
  useEffect(() => {
    if (viewedPostIdRef.current !== post.id) {
      viewedPostIdRef.current = post.id;
      incrementPostViews(post.id);
    }
    setLikes(post.likes);
  }, [post.id, post.likes]);

  useEffect(() => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Inject Yoast-style SEO Meta Tags & JSON-LD Schema into HTML Head
    document.title = `${post.title} | 디지털생활연구소`;

    const metaDesc = post.metaDescription || post.excerpt || `${post.title}에 관한 디지털생활연구소 실용 가이드입니다.`;
    const keywordsStr = post.keywords?.join(', ') || post.tags?.join(', ') || '디지털생활연구소';

    const setMetaTag = (attrName: string, attrVal: string, contentVal: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentVal);
    };

    setMetaTag('name', 'description', metaDesc);
    setMetaTag('name', 'keywords', keywordsStr);
    setMetaTag('property', 'og:title', post.title);
    setMetaTag('property', 'og:description', metaDesc);
    setMetaTag('property', 'og:image', post.coverImage);
    setMetaTag('property', 'og:type', 'article');
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', post.title);
    setMetaTag('name', 'twitter:description', metaDesc);
    setMetaTag('name', 'twitter:image', post.coverImage);

    // Insert JSON-LD Structured Data Script for Search Engine Crawlers (Yoast style)
    let scriptTag = document.getElementById('yoast-schema-jsonld') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'yoast-schema-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const jsonLdData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TechArticle',
          '@id': `https://digitallifelab.com/post/${post.id}#article`,
          'headline': post.title,
          'description': metaDesc,
          'image': [post.coverImage],
          'datePublished': post.createdAt || post.publishedAt,
          'inLanguage': 'ko-KR',
          'publisher': {
            '@type': 'Organization',
            'name': '디지털생활연구소',
            'url': 'https://digitallifelab.com',
          },
          'keywords': keywordsStr,
          'about': {
            '@type': 'Thing',
            'name': post.digitalTool || post.category,
            'description': post.livingProblem || post.subtitle,
          },
          'dependencies': post.testEnvironment || '모바일/데스크톱 환경',
        },
      ],
    };

    scriptTag.text = JSON.stringify(jsonLdData);

    return () => {
      const existingScript = document.getElementById('yoast-schema-jsonld');
      if (existingScript) existingScript.remove();
    };
  }, [post.id, post.title, post.metaDescription, post.excerpt, post.keywords, post.tags, post.coverImage, post.createdAt, post.publishedAt, post.digitalTool, post.category, post.livingProblem, post.subtitle, post.testEnvironment]);

  const handleLike = () => {
    if (!hasLiked) {
      const newLikes = incrementPostLikes(post.id);
      setLikes(newLikes);
      setHasLiked(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Related posts matching category, keywords, or general cluster
  const relatedPosts = useMemo(() => {
    return allPosts
      .filter((p) => p.id !== post.id && p.published)
      .sort((a, b) => {
        // Prioritize same category
        const aSameCat = a.category === post.category ? 1 : 0;
        const bSameCat = b.category === post.category ? 1 : 0;
        if (aSameCat !== bSameCat) return bSameCat - aSameCat;
        return (b.views || 0) - (a.views || 0);
      })
      .slice(0, 4);
  }, [allPosts, post.id, post.category]);

  return (
    <article className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        목록으로 돌아가기
      </button>

      {/* Article Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
          <span className="font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-100/80">
            {post.category}
          </span>
          <span>•</span>
          <span>{post.publishedAt}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 leading-tight">
          {post.title}
        </h1>

        {post.subtitle && (
          <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed">
            {post.subtitle}
          </p>
        )}

        {/* Action Bar (Views, Likes, Share) */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {/* Views counter */}
            <span className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg" title="총 조회수">
              <Eye className="w-4 h-4 text-slate-500" />
              {post.views + 1}
            </span>

            {/* Like button */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                hasLiked
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              }`}
              title="좋아요 표시"
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-white' : ''}`} />
              <span>{likes}</span>
            </button>

            {/* Copy share link */}
            <button
              onClick={handleCopyLink}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="링크 복사"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Table of Contents (TOC) with Smooth Anchor Links */}
      {post.toc && post.toc.length > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-5 space-y-2">
          <h4 className="text-xs font-mono font-bold uppercase text-emerald-950 tracking-wider">
            목차 (Table of Contents)
          </h4>
          <ol className="space-y-1.5 text-xs text-emerald-900/90 font-medium">
            {post.toc.map((rawItem, idx) => {
              // Strip duplicate leading numbers like "1.", "1 -", "소제목 1."
              const cleanTitle = (rawItem || '').replace(/^(\d+[\.\s\-]+|소제목\s*\d*[\.\s\-]*)+/i, '').trim();
              const targetSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)/g, '');

              return (
                <li key={idx} className="flex items-baseline gap-2">
                  <span className="text-emerald-600 font-mono font-bold shrink-0">{idx + 1}.</span>
                  <a
                    href={`#${targetSlug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(targetSlug);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        const headings = Array.from(document.querySelectorAll('.prose h2, .prose h3'));
                        if (headings[idx]) {
                          headings[idx].scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className="hover:underline hover:text-emerald-700 transition-colors cursor-pointer text-left"
                  >
                    {cleanTitle}
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Post Top Ad Banner */}
      <AdBanner location="post_top" />

      {/* Cover Image Banner */}
      <div className="rounded-3xl overflow-hidden bg-slate-900 shadow-md">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full max-h-[480px] object-cover"
        />
      </div>

      {/* Article Body Content */}
      <div className="prose prose-slate max-w-none bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm leading-relaxed">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ node, alt, src, ...props }) => (
              <img
                src={src}
                alt={alt || ''}
                className="rounded-2xl shadow-sm my-6 max-h-[500px] w-full object-cover"
                {...props}
              />
            ),
            div: ({ node, className, children, ...props }: any) => {
              if (props['data-ad-slot'] || props['data-ad']) {
                const loc = props['data-ad-slot'] || props['data-ad'] || 'post_middle';
                return <AdBanner location={loc as any} />;
              }
              return <div className={className} {...props}>{children}</div>;
            },
            h1: ({ node, children, ...props }) => {
              let text = React.Children.toArray(children).join('');
              text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{200D}\u{FE0F}📌💡🛠️❓✅🚀⚡🔍📝📢🏷️🎯✨🔥⭐]/gu, '').trim();
              const slug = text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)/g, '');
              return (
                <h1 id={slug || undefined} className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-3 scroll-mt-20" {...props}>
                  {text}
                </h1>
              );
            },
            h2: ({ node, children, ...props }) => {
              let text = React.Children.toArray(children).join('');
              text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{200D}\u{FE0F}📌💡🛠️❓✅🚀⚡🔍📝📢🏷️🎯✨🔥⭐]/gu, '').trim();
              const slug = text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)/g, '');
              return (
                <h2 id={slug || undefined} className="text-xl sm:text-2xl font-display font-bold text-slate-900 mt-8 mb-4 pt-2 border-t border-slate-100 scroll-mt-20" {...props}>
                  {text}
                </h2>
              );
            },
            h3: ({ node, children, ...props }) => {
              let text = React.Children.toArray(children).join('');
              text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{200D}\u{FE0F}📌💡🛠️❓✅🚀⚡🔍📝📢🏷️🎯✨🔥⭐]/gu, '').trim();
              const slug = text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)/g, '');
              return (
                <h3 id={slug || undefined} className="text-lg font-display font-bold text-slate-900 mt-6 mb-3 text-emerald-900 scroll-mt-20" {...props}>
                  {text}
                </h3>
              );
            },
            p: ({ node, ...props }) => (
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-4" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-6 space-y-2 mb-5 text-slate-700 text-sm sm:text-base" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-6 space-y-2 mb-5 text-slate-700 text-sm sm:text-base" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="leading-relaxed pl-1" {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong className="font-bold text-slate-900 bg-amber-50/80 px-1 py-0.5 rounded" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-emerald-500 pl-4 py-3 my-6 bg-emerald-50/60 rounded-r-xl text-slate-800 text-sm sm:text-base font-medium shadow-2xs" {...props} />
            ),
            a: ({ node, children, href, ...props }) => {
              const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
              
              // Internal link handler
              const handleInternalClick = (e: React.MouseEvent) => {
                if (!href || isExternal) return;
                
                // Try to find target post by id, slug, or href
                let targetSlug = href.replace(/^(internal:|\/post\/|\/|#)/, '').trim();
                let targetPost = allPosts.find(
                  (p) => p.id === targetSlug || p.slug === targetSlug || p.id === href
                );

                // If not found by exact slug/id, search by title keywords in children
                if (!targetPost && typeof children === 'string') {
                  const childText = (children || '').toLowerCase();
                  targetPost = allPosts.find((p) => {
                    const pTitle = (p?.title || '').toLowerCase();
                    return pTitle.includes(childText) || childText.includes(pTitle);
                  });
                }

                if (targetPost) {
                  e.preventDefault();
                  onSelectPost(targetPost);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              };

              return (
                <a
                  href={href}
                  onClick={handleInternalClick}
                  className={`font-semibold underline underline-offset-2 transition-colors inline-flex items-center gap-1 mx-0.5 ${
                    isExternal
                      ? 'text-emerald-600 hover:text-emerald-800'
                      : 'text-blue-600 hover:text-blue-800 bg-blue-50/80 px-1.5 py-0.5 rounded text-xs sm:text-sm font-bold border border-blue-200/60'
                  }`}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  {...props}
                >
                  {!isExternal && <span className="text-blue-500 font-normal">🔗</span>}
                  <span>{children}</span>
                  {isExternal && <ExternalLink className="w-3.5 h-3.5 shrink-0 text-emerald-500 inline" />}
                </a>
              );
            },
            pre: ({ node, ...props }) => (
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-xs my-4 font-mono shadow-inner" {...props} />
            ),
            code: ({ node, className, children, ...props }: any) => {
              const hasClass = Boolean(className);
              const isMultiLine = String(children).includes('\n');
              if (!hasClass && !isMultiLine) {
                return (
                  <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                    {children}
                  </code>
                );
              }
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            hr: ({ node, ...props }) => (
              <hr className="my-8 border-slate-200" {...props} />
            ),
          }}
        >
          {post.content
            ?.replace(/\[AD_SLOT_TOP\]/gi, '<div data-ad-slot="post_top"></div>')
            ?.replace(/\[AD_SLOT_MIDDLE\]|\[AD_SLOT\]|\[AD\]/gi, '<div data-ad-slot="post_middle"></div>')
            ?.replace(/\[AD_SLOT_BOTTOM\]/gi, '<div data-ad-slot="post_bottom"></div>')}
        </ReactMarkdown>
      </div>

      {/* Post Middle Ad Banner */}
      <AdBanner location="post_middle" />

      {/* FAQ Accordions / List */}
      {post.faq && post.faq.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
            자주 묻는 질문 (FAQ)
          </h3>
          <div className="space-y-3">
            {post.faq.map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <h4 className="text-xs sm:text-sm font-bold text-emerald-800">Q. {item.question}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">A. {item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-2">
          <span className="text-xs font-mono text-slate-400">태그:</span>
          {post.tags.map((t, i) => (
            <span
              key={i}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-medium"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Post Bottom Ad Banner */}
      <AdBanner location="post_bottom" />

      {/* Related Posts Internal Link Cluster */}
      {relatedPosts.length > 0 && (
        <section className="space-y-4 pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
              <span>함께 읽으면 좋은 연관 실용 가이드</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">SEO Internal Links</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedPosts.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  onSelectPost(rel);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group cursor-pointer bg-slate-50/70 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-4 transition-all space-y-2.5 shadow-2xs hover:shadow-sm"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="text-emerald-700 font-bold bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                    {rel.category}
                  </span>
                  <span className="text-emerald-600 font-semibold group-hover:underline flex items-center gap-1">
                    읽어보기 →
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                  {rel.title}
                </h4>
                {rel.subtitle && (
                  <p className="text-xs text-slate-500 line-clamp-1 font-medium">
                    {rel.subtitle}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
