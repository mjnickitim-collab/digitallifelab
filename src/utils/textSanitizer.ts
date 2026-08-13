export function removeEmojis(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{200D}\u{FE0F}📌💡🛠️❓✅🚀⚡🔍📝📢🏷️🎯✨🔥⭐▶️▪️▶●✔✖⭕]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function cleanUnwantedTags(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let cleaned = text;

  // 1. Remove parenthetical tags like (원인), (Step by Step), (초보자용), (FAQ), etc.
  cleaned = cleaned.replace(/\s*\((?:원인|원인\s*파악|원인분석|Step\s*by\s*Step|Step-by-Step|초보자용|초보자|해결방법|해결책|단계별|단계별\s*가이드|기본\s*가이드|상세\s*가이드|핵심\s*팁|팁|주의사항|주의|참고|요약|비교|E-E-A-T|SEO|AdSense|가이드|설정방법|필수\s*조건|준비물|결론|FAQ|자주\s*묻는\s*질문|추천|활용법)\)\s*/gi, ' ');

  // 2. Remove orphaned trailing dashes after markdown links e.g. [Text](https://...)---
  cleaned = cleaned.replace(/(\[[^\]]+\]\([^)]+\))\s*-{2,}/g, '$1 ');

  // 3. Clean extra spaces
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ').trim();

  return cleaned;
}

export function stripEmojisFromHeadings(content: string): string {
  if (!content) return content;
  // Replace emojis on heading lines starting with #, ##, ###, ####
  return content.replace(/^(#{1,6}\s+)(.*)$/gm, (_, hashes, headingText) => {
    const cleanedHeading = removeEmojis(cleanUnwantedTags(headingText));
    return `${hashes}${cleanedHeading}`;
  });
}

export function stripFaqFromContent(content: string): string {
  if (!content) return content;
  // Strip any embedded FAQ section in markdown content (e.g. ## 자주 묻는 질문, ### FAQ, etc.)
  const faqPattern = /(?:^|\n)#{1,4}\s*(?:자주\s*묻는\s*질문|FAQ|Q&A|질문과\s*답변)[\s\S]*$/i;
  return content.replace(faqPattern, '').trim();
}

export function sanitizeBlogPostData<T extends Record<string, any>>(postData: T): T {
  if (!postData || typeof postData !== 'object') return postData;

  const result: Record<string, any> = { ...postData };

  // Sanitize single-line text fields and titles
  const stringFields = [
    'title',
    'seoTitle',
    'subtitle',
    'metaDescription',
    'excerpt',
    'livingProblem',
    'digitalTool',
    'testEnvironment',
  ];

  for (const field of stringFields) {
    if (typeof result[field] === 'string') {
      result[field] = removeEmojis(cleanUnwantedTags(result[field]));
    }
  }

  // Sanitize content body
  if (typeof result.content === 'string') {
    let content = cleanUnwantedTags(result.content);
    content = stripEmojisFromHeadings(content);
    content = stripFaqFromContent(content);
    result.content = content;
  }

  // Sanitize TOC - remove FAQ items, emojis, and unwanted tags
  if (Array.isArray(result.toc)) {
    result.toc = result.toc
      .map((item: string) => removeEmojis(cleanUnwantedTags(item)))
      .filter((item: string) => {
        const lower = item.toLowerCase();
        return (
          !lower.includes('자주 묻는 질문') &&
          !lower.includes('faq') &&
          !lower.includes('q&a') &&
          item.trim().length > 0
        );
      });
  }

  // Sanitize FAQ
  if (Array.isArray(result.faq)) {
    result.faq = result.faq.map((item: any) => ({
      ...item,
      question: removeEmojis(cleanUnwantedTags(item?.question || '')),
      answer: cleanUnwantedTags(cleanUnwantedTags(item?.answer || '')),
    }));
  }

  return result as T;
}

