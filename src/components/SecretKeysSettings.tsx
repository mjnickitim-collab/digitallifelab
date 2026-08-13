import React, { useState } from 'react';
import { KeyRound, Shield, Check, Save, Flame, Sparkles, Image as ImageIcon, Lock, Mail } from 'lucide-react';
import { SecretKeysConfig } from '../types';
import { saveSecretKeys } from '../services/storage';

interface SecretKeysSettingsProps {
  secrets: SecretKeysConfig;
  onUpdateSecrets: (updated: SecretKeysConfig) => void;
}

export const SecretKeysSettings: React.FC<SecretKeysSettingsProps> = ({
  secrets,
  onUpdateSecrets,
}) => {
  const [form, setForm] = useState<SecretKeysConfig>(secrets);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveSecretKeys(form);
    onUpdateSecrets(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">
              API Keys & Secret Credentials Panel
            </h2>
            <p className="text-xs text-slate-400">
              Configure your personal Firebase, Gemini AI, Unsplash, and Admin secrets here.
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All API keys and admin secret credentials saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Admin Password */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-bold uppercase">
            <Lock className="w-4 h-4" />
            1. Admin Authentication Password
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300">Admin Secret Password *</label>
            <input
              type="text"
              required
              value={form.adminPassword}
              onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
              className="bg-slate-900 border border-slate-800 focus:border-blue-500 text-xs text-white rounded-xl px-4 py-2.5 w-full font-mono outline-none"
              placeholder="e.g. mySuperSecretBlogAdmin123"
            />
            <p className="text-[11px] text-slate-500">
              Used to unlock the secret Admin Terminal via keyboard shortcut (`Ctrl+Shift+A`) or secret footer link.
            </p>
          </div>
        </div>

        {/* Section 2: Gemini API Key */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase">
            <Sparkles className="w-4 h-4" />
            2. Google Gemini AI API Credentials
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300">Gemini API Key</label>
            <input
              type="password"
              value={form.geminiApiKey}
              onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
              className="bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-white rounded-xl px-4 py-2.5 w-full font-mono outline-none"
              placeholder="AIzaSy..."
            />
            <p className="text-[11px] text-slate-500">
              Required for AI article generation (`gemini-3.6-flash`). If empty, the system attempts to use server environment key (`process.env.GEMINI_API_KEY`).
            </p>
          </div>
        </div>

        {/* Section 3: Resend Email Newsletter API Credentials */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
            <Mail className="w-4 h-4" />
            3. Resend Newsletter Email API Key
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300">Resend API Key *</label>
              <input
                type="password"
                value={form.resendApiKey || ''}
                onChange={(e) => setForm({ ...form, resendApiKey: e.target.value })}
                className="bg-slate-900 border border-slate-800 focus:border-emerald-500 text-xs text-white rounded-xl px-4 py-2.5 w-full font-mono outline-none"
                placeholder="re_123456789..."
              />
              <p className="text-[11px] text-slate-500">
                구독자에게 뉴스레터를 실제 이메일로 전송하기 위한 Resend (resend.com) API Key입니다.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300">Sender From Email</label>
              <input
                type="text"
                value={form.resendFromEmail || 'onboarding@resend.dev'}
                onChange={(e) => setForm({ ...form, resendFromEmail: e.target.value })}
                className="bg-slate-900 border border-slate-800 focus:border-emerald-500 text-xs text-white rounded-xl px-4 py-2.5 w-full font-mono outline-none"
                placeholder="Digital Life Lab <onboarding@resend.dev>"
              />
              <p className="text-[11px] text-slate-500">
                발송자 발신 이메일 주소입니다. 기본값: `onboarding@resend.dev`
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Unsplash Access Key */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold uppercase">
            <ImageIcon className="w-4 h-4" />
            3. Unsplash Photography API Access Key
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300">Unsplash Access Key</label>
            <input
              type="password"
              value={form.unsplashAccessKey}
              onChange={(e) => setForm({ ...form, unsplashAccessKey: e.target.value })}
              className="bg-slate-900 border border-slate-800 focus:border-purple-500 text-xs text-white rounded-xl px-4 py-2.5 w-full font-mono outline-none"
              placeholder="Your Unsplash Access Key..."
            />
            <p className="text-[11px] text-slate-500">
              Enables live high-resolution photo searches for blog headers directly from Unsplash.
            </p>
          </div>
        </div>

        {/* Section 4: Firebase Configuration */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
            <Flame className="w-4 h-4" />
            4. Firebase Firestore & Auth Configuration
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-slate-300">API Key</label>
              <input
                type="text"
                value={form.firebaseApiKey}
                onChange={(e) => setForm({ ...form, firebaseApiKey: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none w-full"
                placeholder="AIzaSy..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300">Auth Domain</label>
              <input
                type="text"
                value={form.firebaseAuthDomain}
                onChange={(e) => setForm({ ...form, firebaseAuthDomain: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none w-full"
                placeholder="myblog.firebaseapp.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300">Project ID</label>
              <input
                type="text"
                value={form.firebaseProjectId}
                onChange={(e) => setForm({ ...form, firebaseProjectId: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none w-full"
                placeholder="my-blog-project"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300">Storage Bucket</label>
              <input
                type="text"
                value={form.firebaseStorageBucket}
                onChange={(e) => setForm({ ...form, firebaseStorageBucket: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none w-full"
                placeholder="myblog.appspot.com"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save All Secret Credentials</span>
        </button>
      </form>
    </div>
  );
};
