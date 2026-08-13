import React, { useState, useEffect } from 'react';
import { Megaphone, Code, Image as ImageIcon, Save, Check, Power, ExternalLink, HelpCircle, Sparkles, RefreshCw } from 'lucide-react';
import { AdPlacementLocation, AdsConfig, AdSlotConfig } from '../types';
import { getAdsConfig, saveAdsConfig, subscribeAdsConfig } from '../services/storage';

export const AdManager: React.FC = () => {
  const [adsConfig, setAdsConfig] = useState<AdsConfig>(getAdsConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<AdPlacementLocation>('home_top');

  useEffect(() => {
    const unsubscribe = subscribeAdsConfig((updated) => {
      setAdsConfig(updated);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleSlot = (slotId: AdPlacementLocation) => {
    const updated: AdsConfig = {
      slots: {
        ...adsConfig.slots,
        [slotId]: {
          ...adsConfig.slots[slotId],
          enabled: !adsConfig.slots[slotId].enabled,
        },
      },
    };
    setAdsConfig(updated);
  };

  const handleSlotChange = (slotId: AdPlacementLocation, key: keyof AdSlotConfig, value: any) => {
    const updated: AdsConfig = {
      slots: {
        ...adsConfig.slots,
        [slotId]: {
          ...adsConfig.slots[slotId],
          [key]: value,
        },
      },
    };
    setAdsConfig(updated);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    saveAdsConfig(adsConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const slotKeys: AdPlacementLocation[] = [
    'home_top',
    'home_middle',
    'home_bottom',
    'post_top',
    'post_middle',
    'post_bottom',
    'sidebar',
  ];

  const currentSlot = adsConfig.slots[activeSlotId];

  // Quick Preset Banner Samples
  const applyPresetBanner = (imageUrl: string, targetUrl: string, altText: string) => {
    handleSlotChange(activeSlotId, 'bannerImageUrl', imageUrl);
    handleSlotChange(activeSlotId, 'bannerTargetUrl', targetUrl);
    handleSlotChange(activeSlotId, 'bannerAltText', altText);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">
              구글 애드센스 & 스폰서 광고 관리 센터
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              메인 화면 및 글 본문 주요 구역에 구글 애드센스 스크립트 또는 3rd party 스폰서 배너를 자유롭게 배치하세요.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-600/20 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>광고 설정 저장</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>모든 광고 배치 설정이 저장되고 실시간으로 블로그에 반영되었습니다!</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Placement Location Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider px-1">
            광고 노출 위치 선택
          </h3>

          <div className="space-y-2">
            {slotKeys.map((key) => {
              const slot = adsConfig.slots[key];
              const isActive = activeSlotId === key;

              return (
                <div
                  key={key}
                  onClick={() => setActiveSlotId(key)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSlot(key);
                      }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                        slot.enabled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                      title={slot.enabled ? '광고 게재 중 (클릭하여 비활성화)' : '광고 중단됨 (클릭하여 활성화)'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{slot.name}</span>
                        {slot.enabled ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                            ON
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.2 rounded">
                            OFF
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{slot.description}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                    {slot.type === 'adsense' ? 'AdSense' : '배너'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Slot Detail Editor & Live Preview */}
        <div className="lg:col-span-8 space-y-6 bg-slate-950 border border-slate-800 rounded-2xl p-6">
          {/* Active Slot Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{currentSlot.name}</h3>
                <span className="text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md">
                  {currentSlot.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{currentSlot.description}</p>
            </div>

            {/* Master On/Off Switch */}
            <div className="flex items-center gap-3 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <span className="text-xs font-mono text-slate-400 pl-2">게재 상태:</span>
              <button
                type="button"
                onClick={() => handleToggleSlot(activeSlotId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentSlot.enabled
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{currentSlot.enabled ? '노출 활성화 (ON)' : '노출 비활성화 (OFF)'}</span>
              </button>
            </div>
          </div>

          {/* Ad Type Selector: Google AdSense vs Custom Banner */}
          <div className="space-y-3">
            <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block">
              1. 광고 유형 선택
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSlotChange(activeSlotId, 'type', 'adsense')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  currentSlot.type === 'adsense'
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div className={`p-2 rounded-lg ${currentSlot.type === 'adsense' ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-800 text-slate-500'}`}>
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Google AdSense (구글 광고)</h4>
                  <p className="text-[11px] text-slate-400">애드센스 태그 및 스크립트 코드</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSlotChange(activeSlotId, 'type', 'banner')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  currentSlot.type === 'banner'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div className={`p-2 rounded-lg ${currentSlot.type === 'banner' ? 'bg-purple-500/30 text-purple-300' : 'bg-slate-800 text-slate-500'}`}>
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">3rd-Party 배너 이미지 & 링크</h4>
                  <p className="text-[11px] text-slate-400">직접 스폰서 이미지 및 타겟 링크 지정</p>
                </div>
              </button>
            </div>
          </div>

          {/* Ad Details Input Form */}
          {currentSlot.type === 'adsense' ? (
            <div className="space-y-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300 font-bold">
                  Google AdSense HTML / JS 스크립트 코드
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {'`<ins class="adsbygoogle">` or `<script>`'}
                </span>
              </div>
              <textarea
                rows={5}
                value={currentSlot.adsenseCode || ''}
                onChange={(e) => handleSlotChange(activeSlotId, 'adsenseCode', e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-slate-200 font-mono rounded-xl p-3 w-full outline-none"
                placeholder={'<ins class="adsbygoogle"\n     style="display:block"\n     data-ad-client="ca-pub-XXXXXXXXXXXX"\n     data-ad-slot="XXXXXXXXXX"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>'}
              />
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                구글 애드센스 승인 후 제공받은 디스플레이 광고 단위 코드를 그대로 붙여넣으세요.
              </p>
            </div>
          ) : (
            <div className="space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-bold">광고 배너 이미지 URL</label>
                <input
                  type="url"
                  value={currentSlot.bannerImageUrl || ''}
                  onChange={(e) => handleSlotChange(activeSlotId, 'bannerImageUrl', e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-slate-200 font-mono rounded-xl px-3 py-2 w-full outline-none"
                  placeholder="https://images.unsplash.com/... 또는 CDN 이미지 링크"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 font-bold">광고 클릭 랜딩 URL (타겟 링크)</label>
                  <input
                    type="url"
                    value={currentSlot.bannerTargetUrl || ''}
                    onChange={(e) => handleSlotChange(activeSlotId, 'bannerTargetUrl', e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-slate-200 font-mono rounded-xl px-3 py-2 w-full outline-none"
                    placeholder="https://sponsor-website.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 font-bold">배너 설명 / 대체 텍스트 (Alt)</label>
                  <input
                    type="text"
                    value={currentSlot.bannerAltText || ''}
                    onChange={(e) => handleSlotChange(activeSlotId, 'bannerAltText', e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-slate-200 rounded-xl px-3 py-2 w-full outline-none"
                    placeholder="예: 디지털생활연구소 신규 가이드북 출시"
                  />
                </div>
              </div>

              {/* Sample Presets for Quick Setup */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono block mb-2">샘플 이미지 빠른 적용:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      applyPresetBanner(
                        'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
                        'https://digitallifelab.com',
                        '디지털생활연구소 후원 파트너십'
                      )
                    }
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 rounded-lg cursor-pointer"
                  >
                    🎨 테크 비즈니스 배너
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyPresetBanner(
                        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
                        'https://digitallifelab.com',
                        '스마트 디지털 라이프 가이드'
                      )
                    }
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 rounded-lg cursor-pointer"
                  >
                    📊 데이터 대시보드 배너
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyPresetBanner(
                        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
                        'https://digitallifelab.com',
                        'AI 도구 활용 특별 강좌'
                      )
                    }
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 rounded-lg cursor-pointer"
                  >
                    🤖 AI 스마트 파트너 배너
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live Preview Box */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider block">
              2. 실시간 노출 미리보기 (Preview)
            </label>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 min-h-[120px] flex items-center justify-center">
              {currentSlot.enabled ? (
                currentSlot.type === 'banner' && currentSlot.bannerImageUrl ? (
                  <a
                    href={currentSlot.bannerTargetUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative rounded-xl overflow-hidden border border-slate-700 max-h-[160px] group"
                  >
                    <img
                      src={currentSlot.bannerImageUrl}
                      alt={currentSlot.bannerAltText}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                    />
                    <div className="absolute top-2 right-2 bg-slate-950/80 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/20">
                      SPONSORED AD
                    </div>
                  </a>
                ) : currentSlot.type === 'adsense' && currentSlot.adsenseCode ? (
                  <div
                    className="w-full p-3 bg-white rounded-xl text-slate-900 text-xs font-mono overflow-auto max-h-[120px]"
                    dangerouslySetInnerHTML={{ __html: currentSlot.adsenseCode }}
                  />
                ) : (
                  <div className="text-center text-slate-500 py-4 text-xs font-mono">
                    [ {currentSlot.name} - 준비중인 광고 배너 ]
                  </div>
                )
              ) : (
                <div className="text-center text-slate-500 py-6 space-y-1">
                  <Power className="w-5 h-5 mx-auto text-slate-600" />
                  <p className="text-xs font-mono text-slate-400">현재 노출 비활성화(OFF) 상태입니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
