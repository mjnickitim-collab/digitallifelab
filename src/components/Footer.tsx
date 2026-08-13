import React, { useState } from 'react';
import { Lock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { addSubscriber } from '../services/storage';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenAdminModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAdminModal }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await addSubscriber(email, 'footer_form');
        setSubscribed(true);
        setEmail('');
      } catch (err) {
        console.error('Subscription failed:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          {/* Column 1: Brand */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-display font-black text-base shadow-xs">
                D
              </div>
              <span className="font-display font-bold text-xl text-white tracking-tight">
                디지털생활연구소<span className="text-emerald-400">.</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              사람들이 일상에서 겪는 문제(건강, 돈, 업무, 육아, 여행, 기기 관리)를 스마트폰과 AI 같은 디지털 도구로 해결해 주는 실용 정보 블로그입니다.
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              주요 서비스 메뉴
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  최신 아티클 & 칼럼
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  소개 (About Us)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Newsletter */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              뉴스레터
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              매주 엄선된 최신 인사이트 에세이를 이메일로 받아보세요.
            </p>
            {subscribed ? (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>구독 신청이 완료되었습니다! 감사합니다.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="이메일 주소를 입력하세요"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 w-full focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      구독 <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer Bottom / Secret Admin Access */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p
            onDoubleClick={onOpenAdminModal}
            className="select-none cursor-default hover:text-slate-400 transition-colors"
            title="더블 클릭하여 관리자 로그인"
          >
            © {new Date().getFullYear()} 디지털생활연구소 (Digital Life Lab). All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('terms')}
              className="hover:text-slate-400 transition-colors cursor-pointer"
            >
              이용약관
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate('privacy')}
              className="hover:text-slate-400 transition-colors cursor-pointer"
            >
              개인정보처리방침
            </button>
            <span>•</span>
            {/* Secret Admin Button */}
            <button
              onClick={onOpenAdminModal}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
              title="관리자 전용 로그인 (Ctrl+Shift+A)"
            >
              <Lock className="w-3 h-3" />
              <span>관리자 로그인</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
