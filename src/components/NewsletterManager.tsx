import React, { useState, useEffect } from 'react';
import {
  Mail,
  Users,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  FileText,
  Calendar,
  Eye,
  Search,
  Check,
  UserPlus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { BlogPost, NewsletterSubscriber, NewsletterIssue } from '../types';
import {
  subscribeSubscribers,
  subscribeNewsletters,
  addSubscriber,
  updateSubscriberStatus,
  deleteSubscriber,
  sendNewsletter,
  getSecretKeys,
} from '../services/storage';

interface NewsletterManagerProps {
  posts: BlogPost[];
}

export const NewsletterManager: React.FC<NewsletterManagerProps> = ({ posts }) => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterIssue[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'compose' | 'subscribers' | 'history'>('compose');

  // Subscriber list controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [newEmail, setNewEmail] = useState('');
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Composer State
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueContent, setIssueContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState('');
  const [previewModalIssue, setPreviewModalIssue] = useState<NewsletterIssue | null>(null);

  // Subscribe real-time Firestore collections
  useEffect(() => {
    const unsubSubscribers = subscribeSubscribers((subs) => setSubscribers(subs));
    const unsubNewsletters = subscribeNewsletters((news) => setNewsletters(news));
    return () => {
      unsubSubscribers();
      unsubNewsletters();
    };
  }, []);

  const activeSubscribers = subscribers.filter((s) => s.status === 'active');
  const unsubscribedCount = subscribers.filter((s) => s.status === 'unsubscribed').length;

  // Filter subscribers list
  const filteredSubscribers = subscribers.filter((sub) => {
    const query = (searchQuery || '').trim().toLowerCase();
    const matchesSearch = !query || (sub?.email || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle adding subscriber manually
  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || isAddingSub) return;
    setIsAddingSub(true);
    try {
      await addSubscriber(newEmail, 'admin_manual');
      setNewEmail('');
    } catch (err) {
      console.error('Failed to add subscriber:', err);
    } finally {
      setIsAddingSub(false);
    }
  };

  // Copy active subscriber emails
  const handleCopyEmails = () => {
    const emails = activeSubscribers.map((s) => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Auto-fill newsletter content when a post is selected
  const handleSelectPost = (postId: string) => {
    setSelectedPostId(postId);
    if (!postId) return;
    const post = posts.find((p) => p.id === postId);
    if (post) {
      setIssueTitle(`[디지생활] ${post.title}`);
      const content = `안녕하세요! 디지털생활연구소 구독자 여러분 👋\n\n이번 주 엄선된 에세이를 전해드립니다.\n\n**${post.title}**\n${post.subtitle ? '_' + post.subtitle + '_\n' : ''}\n${post.excerpt}\n\n👉 **전체 칼럼 읽기**: ${window.location.origin}/post/${post.slug || post.id}\n\n---\n디지털 기술로 삶을 더 쉽고 풍요롭게 만들어보세요. 궁금한 점은 언제든 이메일로 회신해 주시기 바랍니다.`;
      setIssueContent(content);
    }
  };

  // Handle sending newsletter
  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle || !issueContent || isSending) return;

    if (activeSubscribers.length === 0) {
      alert('활성 구독자가 없습니다. 먼저 구독자를 추가하거나 수집해주세요.');
      return;
    }

    if (!confirm(`총 ${activeSubscribers.length}명의 활성 구독자에게 뉴스레터를 발행하시겠습니까?`)) {
      return;
    }

    setIsSending(true);
    try {
      const selectedPost = posts.find((p) => p.id === selectedPostId);
      const recipientEmails = activeSubscribers.map((s) => s.email);
      const secrets = getSecretKeys();

      // Trigger server-side Resend API call
      const res = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: issueTitle,
          content: issueContent,
          recipients: recipientEmails,
          resendApiKey: secrets.resendApiKey,
          resendFromEmail: secrets.resendFromEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`뉴스레터 발송 실패: ${data.error || '이메일 발송 중 문제가 발생했습니다.'}`);
        setSendSuccessMessage(`⚠️ 발송 오류: ${data.error || 'Resend API 설정 또는 가입 이메일 수신 제한을 확인해 주세요.'}`);
        setTimeout(() => setSendSuccessMessage(''), 10000);
        return;
      }

      // Save issue history to Firestore
      await sendNewsletter({
        title: issueTitle,
        content: issueContent,
        postId: selectedPostId || undefined,
        postTitle: selectedPost?.title || undefined,
        recipientCount: activeSubscribers.length,
      });

      if (data.delivered) {
        setSendSuccessMessage(`Resend API를 통해 ${activeSubscribers.length}명의 구독자에게 이메일이 실제 발송되었습니다!`);
      } else if (data.note) {
        setSendSuccessMessage(`${data.note}`);
      } else {
        setSendSuccessMessage(`총 ${activeSubscribers.length}명의 구독자에게 뉴스레터가 발행되었습니다.`);
      }

      setIssueTitle('');
      setIssueContent('');
      setSelectedPostId('');
      setActiveSubTab('history');
      setTimeout(() => setSendSuccessMessage(''), 8000);
    } catch (err) {
      console.error('Newsletter send error:', err);
      alert('뉴스레터 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">전체 구독자</p>
            <h3 className="text-2xl font-display font-bold text-slate-900 mt-1">{subscribers.length}명</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">활성 수신 구독자</p>
            <h3 className="text-2xl font-display font-bold text-emerald-600 mt-1">{activeSubscribers.length}명</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">총 발행 뉴스레터</p>
            <h3 className="text-2xl font-display font-bold text-indigo-600 mt-1">{newsletters.length}건</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {sendSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{sendSuccessMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('compose')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'compose'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>새 뉴스레터 작성 & 발행</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('subscribers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'subscribers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-500" />
          <span>구독자 명단 관리 ({subscribers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span>발행 이력 ({newsletters.length})</span>
        </button>
      </div>

      {/* Sub-Tab 1: Newsletter Composer */}
      {activeSubTab === 'compose' && (
        <form onSubmit={handleSendNewsletter} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                주간 에세이 뉴스레터 작성
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                등록된 활성 구독자({activeSubscribers.length}명)에게 전송할 주간 인사이트 뉴스레터를 작성합니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">
                수신 대상: {activeSubscribers.length}명
              </span>
            </div>
          </div>

          {/* Quick Post Attachment Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              최신 블로그 포스트 연동 (1클릭 본문 생성)
            </label>
            <select
              value={selectedPostId}
              onChange={(e) => handleSelectPost(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none w-full focus:border-blue-600 cursor-pointer"
            >
              <option value="">-- 발행된 포스트 선택 안 함 (직접 작성) --</option>
              {posts.map((post) => (
                <option key={post.id} value={post.id}>
                  [{post.category}] {post.title} ({post.publishedAt})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">뉴스레터 제목 / 이메일 Subject *</label>
            <input
              type="text"
              required
              placeholder="예: [주간 디지생활] 스마트폰 배터리 수명을 2배 늘리는 실전 세팅 가이드"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none w-full focus:border-blue-600"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">뉴스레터 본문 내용 (마크다운 지원) *</label>
            <textarea
              required
              rows={12}
              placeholder="구독자에게 발송할 인사이트 에세이 본문을 작성해주세요..."
              value={issueContent}
              onChange={(e) => setIssueContent(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-900 outline-none w-full focus:border-blue-600"
            />
          </div>

          {/* Live Email Preview Box */}
          {issueContent && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-mono text-slate-500 font-bold uppercase flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> 이메일 미리보기
              </span>
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 text-xs space-y-3 font-sans border border-slate-800 shadow-inner">
                <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between text-slate-400 text-[11px]">
                  <span>보낸사람: 디지털생활연구소 &lt;newsletter@digitallifelab.com&gt;</span>
                  <span>수신자: {activeSubscribers.length > 0 ? activeSubscribers[0].email : 'subscriber@example.com'}</span>
                </div>
                <h4 className="font-bold text-sm text-white">{issueTitle || '제목 없음'}</h4>
                <div className="whitespace-pre-wrap text-slate-300 leading-relaxed font-sans">{issueContent}</div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isSending || !issueTitle || !issueContent}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>뉴스레터 발송 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>뉴스레터 발행 및 발송 ({activeSubscribers.length}명)</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Sub-Tab 2: Subscribers Management List */}
      {activeSubTab === 'subscribers' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                뉴스레터 구독자 목록 관리
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Firestore 데이터베이스에 수집 및 기록된 구독자 정보를 실시간 관리합니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyEmails}
                disabled={activeSubscribers.length === 0}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {copiedSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSuccess ? '복사 완료!' : '이메일 주소 복사'}</span>
              </button>
            </div>
          </div>

          {/* Add subscriber form */}
          <form onSubmit={handleAddSubscriber} className="flex gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <input
              type="email"
              required
              placeholder="신규 구독자 이메일 주소 직접 추가 (예: user@example.com)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none w-full focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={isAddingSub}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              {isAddingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>구독자 추가</span>
            </button>
          </form>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="이메일 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 outline-none w-full focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                전체 ({subscribers.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                활성 ({activeSubscribers.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unsubscribed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  statusFilter === 'unsubscribed' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                해지 ({unsubscribedCount})
              </button>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">이메일</th>
                    <th className="px-4 py-3">구독 신청일</th>
                    <th className="px-4 py-3">유입 경로</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3 text-right">관리 Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                        구독자 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{sub.email}</td>
                        <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                          {new Date(sub.subscribedAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {sub.source === 'footer_form' ? '푸터 서식' : sub.source === 'admin_manual' ? '관리자 추가' : sub.source || '웹사이트'}
                        </td>
                        <td className="px-4 py-3">
                          {sub.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> 구독 중
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                              <XCircle className="w-3 h-3" /> 수신 거부
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateSubscriberStatus(sub.id, sub.status === 'active' ? 'unsubscribed' : 'active')
                              }
                              className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title={sub.status === 'active' ? '수신거부로 변경' : '구독중으로 변경'}
                            >
                              {sub.status === 'active' ? '구독 해지' : '구독 복구'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`${sub.email} 구독자를 정말 삭제하시겠습니까?`)) {
                                  deleteSubscriber(sub.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Sent Newsletters History */}
      {activeSubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              발행 완료된 뉴스레터 이력
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              과거 구독자들에게 발행된 뉴스레터 아카이브 및 발송 기록입니다.
            </p>
          </div>

          {newsletters.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Mail className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">발행된 뉴스레터가 아직 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {newsletters.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 hover:border-blue-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                          발송 완료
                        </span>
                        {issue.postTitle && (
                          <span className="text-[10px] font-mono bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-md truncate max-w-xs">
                            연동: {issue.postTitle}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{issue.title}</h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-slate-500 block">
                        발행일: {new Date(issue.sentAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-600 font-bold">
                        발송 대상: {issue.recipientCount}명
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {issue.content}
                  </p>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setPreviewModalIssue(issue)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>전체 본문 확인</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Detail Modal */}
      {previewModalIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                뉴스레터 상세 내용
              </h3>
              <button
                type="button"
                onClick={() => setPreviewModalIssue(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-500">
                발행 일시: {new Date(previewModalIssue.sentAt).toLocaleString('ko-KR')} | 발송 수신자: {previewModalIssue.recipientCount}명
              </span>
              <h4 className="text-base font-bold text-slate-900">{previewModalIssue.title}</h4>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 text-xs whitespace-pre-wrap leading-relaxed font-sans border border-slate-800">
              {previewModalIssue.content}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewModalIssue(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
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
