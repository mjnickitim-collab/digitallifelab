import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, X, ArrowRight } from 'lucide-react';
import { verifyAdminPassword } from '../services/storage';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onGoogleLogin?: () => Promise<void>;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onGoogleLogin,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(password)) {
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  const handleGoogleClick = async () => {
    if (!onGoogleLogin) return;
    try {
      setIsGoogleLoading(true);
      setError(false);
      await onGoogleLogin();
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 text-center pt-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            관리자 대시보드 로그인
          </h2>
          <p className="text-xs text-slate-400">
            구글 계정으로 로그인하거나 관리자 비밀번호를 입력하면 즉시 어드민 대시보드로 이동합니다.
          </p>
        </div>

        {/* Google Login Button */}
        {onGoogleLogin && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isGoogleLoading}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? '로그인 처리 중...' : 'Google 계정으로 어드민 로그인'}</span>
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] text-slate-500 font-mono uppercase shrink-0">또는</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              비밀번호 직접 입력
            </label>
            <input
              type="password"
              placeholder="비밀번호 입력 (기본: admin1234)"
              required={!onGoogleLogin}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white outline-none w-full font-mono placeholder:text-slate-600"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>로그인에 실패했습니다. 다시 시도해 주세요.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            로그인 및 어드민 열기 <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 text-center font-mono">
          <span>시크릿 단축키: 사이트 어디서든 Ctrl+Shift+A 누르기</span>
        </div>
      </div>
    </div>
  );
};

