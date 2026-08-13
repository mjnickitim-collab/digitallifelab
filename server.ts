import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache for sitemap
let sitemapCache: string | null = null;
let lastSitemapTime = 0;
const SITEMAP_CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Helper to construct sitemap XML
function generateSitemapXml(baseUrl: string, posts: any[] = []): string {
  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/about", priority: "0.8", changefreq: "monthly" },
    { url: "/terms", priority: "0.5", changefreq: "yearly" },
    { url: "/privacy", priority: "0.5", changefreq: "yearly" },
  ];

  const now = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  staticPages.forEach((page) => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  if (Array.isArray(posts)) {
    posts.forEach((post) => {
      if (post.published !== false) {
        const slug = post.slug || post.id;
        const lastmod = post.updatedAt || post.publishedAt || now;
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/post/${encodeURIComponent(slug)}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    });
  }

  xml += `</urlset>`;
  return xml;
}

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "ModaBlog Platform", timestamp: new Date().toISOString() });
});

// 2. Sitemap.xml Endpoint
app.get("/sitemap.xml", (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;

  const now = Date.now();
  if (sitemapCache && now - lastSitemapTime < SITEMAP_CACHE_TTL) {
    return res.send(sitemapCache);
  }

  // Fallback initial posts if no posts passed
  const initialPosts = [
    { slug: "sleep-quality-smart-watch-tracker", publishedAt: "2026-08-10" },
    { slug: "save-mobile-plan-fees-alttel-app", publishedAt: "2026-08-08" },
    { slug: "clean-up-smartphone-storage-cloud-backup", publishedAt: "2026-08-05" },
    { slug: "travel-itinerary-google-maps-app", publishedAt: "2026-08-02" },
    { slug: "smart-home-automation-routine", publishedAt: "2026-07-28" },
    { slug: "focus-app-timer-time-blocking", publishedAt: "2026-07-25" },
  ];

  sitemapCache = generateSitemapXml(baseUrl, initialPosts);
  lastSitemapTime = now;
  return res.send(sitemapCache);
});

// Post sitemap update trigger
app.post("/api/update-sitemap", (req, res) => {
  const { posts } = req.body;
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  sitemapCache = generateSitemapXml(baseUrl, posts || []);
  lastSitemapTime = Date.now();
  res.json({ success: true, message: "Sitemap updated and cached." });
});

// 3. AI Article Auto-Generation API using Gemini API (@google/genai)
app.post("/api/generate-article", async (req, res) => {
  try {
    const { topic, category, tone, targetWordCount, apiKey, publicationCount } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    // Prefer custom API key passed in body or process.env.GEMINI_API_KEY
    const keyToUse = apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured. Please set your Gemini API key in Secret Settings or .env file."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: keyToUse,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const isReissue = publicationCount && Number(publicationCount) > 0;

    let prompt = `당신은 구글 검색엔진(Google SEO) 상위 노출, 구글 애드센스(AdSense) 수익 최적화, 그리고 독자 가독성(Readability) 분야 최정상급 전문 카피라이터이자 SEO/그로스 마케팅 디렉터입니다.

당신의 목표는 "구글 상위노출 + 높은 체류시간 + 자연스러운 광고 노출 환경"을 동시에 만족하는 프리미엄 블로그 콘텐츠를 생산하는 것입니다.

★ 핵심 브랜드 원칙: 디지털생활연구소 (Digital Life Lab) - "생활 문제 → 디지털 도구" 구조 ★
사람들이 일상에서 겪는 실질적인 생활 문제(건강, 경제, 생산성, 리빙, 여행, IT·기기 등)를 스마트폰, PC, AI, 앱 등 디지털 도구로 해결하는 실용 가이드를 제공합니다.

입력 정보:
- 메인 포커스 키워드: "${topic}"
- 블로그 주요 주제: "${topic}"
- 카테고리: "${category || "건강·웰빙"}" (선택 가능: 건강·웰빙, 경제, 생산성, 리빙, 여행, IT·기기)
- 작성 톤/어조: "${tone || "친근하고 과장되지 않은 실용적 존댓말"}"
- 목표 분량: 공백 포함 2,500 ~ 4,000자
${isReissue ? `- 이전 발행 횟수: ${publicationCount}회 (중복 방지 변형 작성 대상)` : ''}

${isReissue ? `[★ 재발행/중복 방지 변형 지침 - 필독 ★]
이 주제("${topic}")는 이전에 이미 ${publicationCount}회 작성되어 발행된 이력이 있습니다.
기존에 발행된 전형적인 글과의 중복을 완전 차단하기 위하여, 이번 칼럼은 완전히 다른 새로운 시각과 차별화된 접근 방식으로 작성하십시오.
1. 기존의 일반적인 설명 대신, 새로운 관점/심화 활용법/최신 업데이트 기능/상급자 팁/특수 시나리오 사례에 집중하십시오.
2. 제목과 소제목(H2, H3), 세부 단락의 시나리오 및 해결 과정을 이전과 겹치지 않는 신선한 기획으로 구성하십시오.
3. 구체적인 도구 사용법이나 팁도 깊이감 있고 차별화된 꿀팁 위주로 작성하십시오.` : ''}

[★ 핵심 강조 및 필수 강제 규칙 - 절대 준수 ★]

1. 이모지/이모티콘 절대 금지:
 - 본문 및 소제목에 📌, 💡, 🚀, ❓, ✅ 등 모든 종류의 이모지/이모티콘 문자를 절대로 포함하지 마십시오. 오직 명확하고 깔끔한 텍스트로만 작성하십시오.

2. 전환어(Transition Words) 풍부한 사용:
 - 문단 및 문장 연결부마다 한국어 전환어를 풍부하고 자연스럽게 배치하십시오.
   (예: 따라서, 게다가, 하지만, 반면에, 예를 들어, 결과적으로, 사실상, 한편, 나아가, 요컨대, 궁극적으로, 그럼에도 불구하고, 요약하자면, 이와 함께 등)

3. 글 분량 및 구조적 "광고 친화적" 페이싱 (AdSense 최적화 핵심):
 - 본문 전체 분량은 반드시 공백 포함 2,500자 ~ 4,000자 수준으로 깊이 있게 작문하십시오.
 - <h2> 소제목은 최소 5개 이상 균등 배치하고, 각 H2 섹션은 디스플레이 광고가 자연스럽게 삽입될 수 있는 "시각적 호흡 지점"을 만드십시오.
 - 한 문단이 5~6 줄을 넘지 않도록 나누어 화면 스크롤 리듬을 유지하십시오.
 - 도입부(첫 100~150단어)는 검색 의도를 즉시 충족시키는 훅(Hook)과 핵심 요약으로 시작하십시오.

4. SEO 최적화 구조 및 태그 규칙:
 - 메인 타이틀 (<h1> 역할) 1개만 사용.
 - <h2> 소제목은 최소 5개 이상 균등 배치.
 - <h2> 하위는 <h3>로 세부 계층 구조화.
 - 능동태(Active Voice) 중심 작성, 수동태 최소화.
 - 핵심 용어는 <strong>, 요약은 <ul><li>, 핵심 사례/인용은 <blockquote>로 시각화.
 - [중요: FAQ 중복 금지] 본문(content) 마크다운 내에 '자주 묻는 질문'이나 'FAQ' 섹션을 절대로 추가하지 마십시오. FAQ는 오직 반환 JSON 객체의 faq 배열 필드에만 3~5개 질문-답변으로 작성해야 합니다.
 - [외부 링크 권장] 본문 내 관련 정보가 필요한 경우(예: 삼성 헬스, 마인드카페, Google, Notion 등 공식 도메인) 마크다운 링크 [서비스명 공식 사이트](https://...) 형태로 깨끗하게 연결하십시오. 단, URL 뒤에 --- 와 같은 불필요한 기호를 절대 붙이지 마십시오.
 - 구체적인 통계·수치·연도·앱 화면 명칭·버튼 위치 등의 실제 데이터를 인용해 E-E-A-T(전문성·권위성·신뢰성)를 극대화하십시오.
 - [AD], 임의 마크다운(#, **, --- 등) 중 본문에 불필요한 서식 노출 없이 순수 마크다운 및 HTML 태그 구조로 깔끔하게 작성하십시오.

5. 애드센스 정책 준수 및 품질 신호:
 - "클릭하세요", "광고를 눌러주세요" 등 광고 클릭을 직접 유도하는 문구 절대 금지.
 - 자극적 클릭베이트 제목/과장 광고성 문구 금지, 정보 가치 중심으로 진정성 있게 작성.

6. 검색엔진 최적화(SEO) 및 내부 링크(Internal Linking) 필수 규칙:
 - 독자의 체류시간 향상과 검색엔진 크롤링 최적화를 위해 본문 중간 및 하단에 맥락상 연관된 내부 가이드 링크를 반드시 2~3개 포함하십시오.
 - 내부 링크 작성 형식:
   **연관 추천 가이드**: [관련 실용 칼럼 제목](/post/관련-영문슬러그)
 - 대표 연결 가능 내부 주제 예시:
   * 수면/피로 관리 -> [수면 패턴 분석 앱으로 깊은 잠 자는 법](/post/sleep-quality-smart-watch-tracker)
   * 통신비/절약 -> [매달 내는 통신비 요금폭탄 막는 법](/post/save-mobile-plan-fees-alttel-app)
   * 스마트폰 용량/정리 -> [스마트폰 저장공간 20GB 즉시 확보하는 팁](/post/clean-up-smartphone-storage-cloud-backup)
   * 여행/길찾기 -> [해외여행 갈 때 길치도 한 번에 동선 짜는 구글맵 활용법](/post/travel-itinerary-google-maps-app)
   * 스마트홈/살림 -> [퇴근 후 알아서 켜지는 스마트홈 라이프](/post/smart-home-automation-routine)
   * 생산성/시간관리 -> [스마트폰 딴짓 멈추고 몰입력 2배 높이는 뽀모도로 앱 가이드](/post/focus-app-timer-time-blocking)

7. 괄호 수식어, 이모지 및 레이블 태그 문자열 절대 금지 (최상위 필수 규칙):
 - 소제목(h2, h3), 제목, TOC, 요약문 어디에도 📌, 💡, 🛠️, ❓, 🚀, ⚡ 등 어떠한 이모지/아이콘 기호도 절대로 포함하지 마십시오. (단, 내부 링크 안내 문장의 텍스트 강조용으로만 자연스럽게 사용 가능)
 - 소제목(h2, h3), 제목, 요약문 어디에도 '(원인)', '(Step by Step)', '(초보자용)', '(해결방법)', '(원인 파악)', '(핵심 팁)', '(주의사항)', '(E-E-A-T)', '(SEO)', '(단계별)' 등과 같은 괄호 태그나 수식어 문구를 절대로 작성하지 마십시오.
 - 오직 자연스럽고 매끄러운 한글 문장과 이모지 없는 깔끔한 표준 소제목으로만 작문하십시오.

8. 메타데이터 최적화:
 - SEO 타이틀(meta title)은 55~60자 이내, 메인 키워드를 앞쪽에 배치.
 - 메타 디스크립션은 140~155자 이내, 검색 의도 충족 + 클릭 유도 문장으로 작성.

[JSON 이스케이프 절대 주의]
 - 모든 문자열 값(특히 content 마크다운 본문) 내부의 큰따옴표(")는 반드시 \\" 로 이스케이프하거나 작은따옴표(')로 대체하여 JSON SyntaxError가 발생하지 않도록 하십시오.

작성 완료 후 아래 JSON 객체 포맷으로만 반환하세요 (toc 항목은 앞자리 번호나 (원인), (Step by Step) 등 괄호 수식어 없이 순수 제목 텍스트만 넣으십시오):
{
  "title": "String ([생활 문제] + [디지털 도구 해결] + [결과/베네핏] 32자 내외)",
  "seoTitle": "String (55~60자, 메인 키워드 앞 배치)",
  "subtitle": "String (핵심 베네핏 1문장 요약)",
  "metaDescription": "String (140~155자, 메인 키워드 포함)",
  "excerpt": "String (블로그 카드용 2-3문장 핵심 요약)",
  "category": "String",
  "tags": ["String"],
  "keywords": ["String"],
  "slug": "String (영문/한글 URL 슬러그)",
  "livingProblem": "String (사람이 겪는 생활 문제 1문장)",
  "digitalTool": "String (해결 디지털 도구 명칭)",
  "testEnvironment": "String (검증 환경 예: 갤럭시 S25, iOS 18)",
  "readTimeMinutes": 5,
  "toc": ["String (숫자 접두사 없는 주요 소제목 순수 텍스트 배열)"],
  "faq": [{ "question": "String", "answer": "String" }],
  "content": "Full markdown content string in Korean"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    const rawText = response.text || "";
    
    // Robust JSON Parser with Auto-Repair
    const safeJsonParse = (textStr: string) => {
      let cleaned = textStr.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      }

      try {
        return JSON.parse(cleaned);
      } catch (err1: any) {
        console.warn("Standard JSON.parse failed. Attempting sanitization...", err1.message);

        // Sanitize unescaped control characters inside JSON strings
        try {
          const sanitized = cleaned.replace(/[\u0000-\u001F]+/g, (match) => {
            if (match === "\n") return "\\n";
            if (match === "\r") return "\\r";
            if (match === "\t") return "\\t";
            return "";
          });
          return JSON.parse(sanitized);
        } catch (err2: any) {
          console.warn("Sanitizing failed. Attempting structural recovery...", err2.message);

          // If JSON string was cut off mid-way, attempt to close trailing quote and braces
          try {
            let recovered = cleaned;
            const doubleQuotes = (recovered.match(/(?<!\\)"/g) || []).length;
            if (doubleQuotes % 2 !== 0) {
              recovered += '"';
            }
            if (!recovered.trim().endsWith("}")) {
              recovered += '}';
            }
            return JSON.parse(recovered);
          } catch (err3) {
            console.error("All JSON repair attempts failed. Raw response snippet:", cleaned.slice(-300));
            throw new Error(`AI가 생성한 JSON 결과를 파싱할 수 없습니다: ${err1.message}`);
          }
        }
      }
    };

    const parsed = safeJsonParse(rawText);

    // Sanitizer helper to remove unwanted parenthetical meta tags while preserving valid links
    const cleanUnwantedTags = (text: string): string => {
      if (!text || typeof text !== "string") return text;
      return text
        .replace(/\s*\((?:원인|원인\s*파악|원인분석|Step\s*by\s*Step|Step-by-Step|초보자용|초보자|해결방법|해결책|단계별|단계별\s*가이드|기본\s*가이드|상세\s*가이드|핵심\s*팁|팁|주의사항|주의|참고|요약|비교|E-E-A-T|SEO|AdSense|가이드|설정방법|필수\s*조건|준비물|결론|FAQ|자주\s*묻는\s*질문|추천|활용법)\)\s*/gi, " ")
        .replace(/(\[[^\]]+\]\([^)]+\))\s*-{2,}/g, "$1 ")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
    };

    const sanitizeArticleObject = (art: any) => {
      if (!art || typeof art !== "object") return art;
      const fields = [
        "title", "seoTitle", "subtitle", "metaDescription", "excerpt",
        "content", "livingProblem", "digitalTool", "testEnvironment"
      ];
      for (const f of fields) {
        if (typeof art[f] === "string") {
          art[f] = cleanUnwantedTags(art[f]);
        }
      }
      if (Array.isArray(art.toc)) {
        art.toc = art.toc.map((item: string) => cleanUnwantedTags(item));
      }
      if (Array.isArray(art.faq)) {
        art.faq = art.faq.map((item: any) => ({
          question: cleanUnwantedTags(item?.question || ""),
          answer: cleanUnwantedTags(item?.answer || "")
        }));
      }
      return art;
    };

    const cleanedArticle = sanitizeArticleObject(parsed);

    return res.json({ success: true, article: cleanedArticle });
  } catch (err: any) {
    console.error("Gemini API Article Generation Error:", err);
    return res.status(500).json({
      error: err.message || "Failed to generate article using Gemini AI.",
    });
  }
});

// 4. Unsplash Image Search Proxy API
app.get("/api/search-unsplash", async (req, res) => {
  try {
    const query = (req.query.query as string) || "technology minimalism";
    const userAccessKey = (req.query.accessKey as string) || process.env.UNSPLASH_ACCESS_KEY;

    if (userAccessKey) {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${userAccessKey}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const images = data.results.map((img: any) => ({
          id: img.id,
          url: img.urls.regular,
          thumb: img.urls.small,
          caption: img.alt_description || img.description || query,
          authorName: img.user?.name || "Unsplash Creator",
          authorLink: img.user?.links?.html || "https://unsplash.com",
        }));
        return res.json({ success: true, images });
      }
    }

    // High quality curated fallback image collections matching queries
    const fallbackImages = [
      {
        id: "fb-1",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
        thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
        caption: "Abstract digital waves and geometry",
        authorName: "Unsplash Studio",
      },
      {
        id: "fb-2",
        url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200",
        thumb: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=400",
        caption: "Minimalist desk and notebook workspace",
        authorName: "Unsplash Workspace",
      },
      {
        id: "fb-3",
        url: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=1200",
        thumb: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=400",
        caption: "Quiet focus reading setup",
        authorName: "Unsplash Reader",
      },
      {
        id: "fb-4",
        url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200",
        thumb: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400",
        caption: "Clean software engineering setup",
        authorName: "Unsplash Tech",
      },
    ];

    return res.json({ success: true, images: fallbackImages, note: "Using curated royalty-free images." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to search images." });
  }
});

// 5. Resend Email Newsletter API Endpoint
app.post("/api/send-newsletter", async (req, res) => {
  try {
    const { title, content, recipients, resendApiKey, resendFromEmail } = req.body;

    if (!title || !content || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "필수 필드가 누락되었습니다 (title, content, recipients)." });
    }

    const apiKey = resendApiKey || process.env.RESEND_API_KEY;
    const fromAddress = resendFromEmail || process.env.RESEND_FROM_EMAIL || "디지털생활연구소 <onboarding@resend.dev>";

    if (!apiKey) {
      return res.json({
        success: true,
        delivered: false,
        recipientCount: recipients.length,
        note: "Resend API 키가 설정되지 않았습니다. [API Keys & Secrets] 설정에서 Resend API Key를 입력하시면 실제 이메일 수신함으로 즉시 전송됩니다.",
      });
    }

    // Call Resend REST API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: recipients,
        subject: title,
        text: content,
        html: `<div style="font-family: 'Apple SD Gothic Neo', sans-serif; line-height: 1.7; color: #1e293b; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded-radius: 12px;">
          <div style="background-color: #2563eb; padding: 16px 20px; border-radius: 8px; color: #ffffff; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
            디지털생활연구소 Newsletter
          </div>
          <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 16px;">${title}</h2>
          <div style="white-space: pre-wrap; font-size: 14px; color: #334155;">${content}</div>
          <hr style="margin-top: 32px; border: none; border-top: 1px solid #e2e8f0;"/>
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 16px;">
            본 이메일은 디지털생활연구소 구독 회원에게 발송된 수신 전용 뉴스레터입니다.
          </p>
        </div>`,
      }),
    });

    const resData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error response:", resData);
      let userFriendlyMsg = resData.message || "Resend API 전송 실패";
      if (resData.message && (resData.message.includes("testing emails") || resData.message.includes("only send"))) {
        userFriendlyMsg = "Resend 테스트 모드(onboarding@resend.dev)에서는 Resend 가입 이메일로만 발송할 수 있습니다. 상단 [API 키 관리]에서 Resend API Key를 등록하거나, 본인 이메일로 발송 테스트를 진행해 주세요.";
      }
      return res.status(resendResponse.status || 400).json({
        error: userFriendlyMsg,
        details: resData,
      });
    }

    return res.json({
      success: true,
      delivered: true,
      resendId: resData.id,
      recipientCount: recipients.length,
      message: `Resend를 통해 ${recipients.length}명의 구독자에게 이메일 발송 완료!`,
    });
  } catch (err: any) {
    console.error("Newsletter send endpoint error:", err);
    return res.status(500).json({ error: err.message || "Newsletter sending failed." });
  }
});

async function startServer() {
  // Vite middleware for dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Fallback for non-API routes in dev mode to index.html
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) return next();
      try {
        const fs = await import("fs");
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
