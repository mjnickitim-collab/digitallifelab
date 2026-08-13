import React, { useState, useEffect } from 'react';
import { AdPlacementLocation, AdsConfig, AdSlotConfig } from '../types';
import { subscribeAdsConfig, getAdsConfig } from '../services/storage';
import { ExternalLink, Megaphone, Sparkles } from 'lucide-react';

interface AdBannerProps {
  location: AdPlacementLocation;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ location, className = '' }) => {
  const [adsConfig, setAdsConfig] = useState<AdsConfig>(getAdsConfig());

  useEffect(() => {
    const unsubscribe = subscribeAdsConfig((updated) => {
      setAdsConfig(updated);
    });
    return () => unsubscribe();
  }, []);

  const slot: AdSlotConfig | undefined = adsConfig.slots?.[location];

  // If slot is not enabled or doesn't exist, don't display
  if (!slot || !slot.enabled) {
    return null;
  }

  return (
    <div className={`my-6 w-full ${className}`}>
      {/* Banner Advertisement Type */}
      {slot.type === 'banner' && (
        <div className="relative group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all">
          <a
            href={slot.bannerTargetUrl || '#'}
            target={slot.bannerOpenNewTab !== false ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="block relative overflow-hidden"
          >
            {slot.bannerImageUrl ? (
              <div className="relative w-full max-h-[220px] sm:max-h-[280px] overflow-hidden bg-slate-900 flex items-center justify-center">
                <img
                  src={slot.bannerImageUrl}
                  alt={slot.bannerAltText || slot.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 opacity-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Megaphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white mb-1 inline-block">
                      SPONSORED AD
                    </span>
                    <h4 className="text-base font-bold text-white">
                      {slot.bannerAltText || '스폰서 파트너십 광고 배너'}
                    </h4>
                  </div>
                </div>
                <span className="px-4 py-2 bg-white text-blue-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 hover:bg-blue-50 transition-colors">
                  바로가기 <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            )}

            {/* AD Tag Badge */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-white/20 shadow-sm">
              <Megaphone className="w-3 h-3 text-amber-400" />
              <span>AD</span>
            </div>
          </a>
        </div>
      )}

      {/* Google AdSense Type */}
      {slot.type === 'adsense' && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 sm:p-6 text-center">
          <div className="absolute top-2 right-3 z-10 flex items-center gap-1 text-[10px] font-mono font-semibold text-slate-400 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
            <span>Google AdSense</span>
          </div>

          {slot.adsenseCode && slot.adsenseCode.trim().length > 0 ? (
            <div
              className="adsense-container w-full min-h-[90px] flex items-center justify-center overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: slot.adsenseCode }}
            />
          ) : (
            <div className="py-8 px-4 flex flex-col items-center justify-center space-y-2 text-slate-500">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-700">Google AdSense 광고 영역</h4>
              <p className="text-[11px] text-slate-400 max-w-sm">
                어드민 대시보드의 광고 관리에서 구글 애드센스 코드 또는 스크립트 링크를 입력하시면 자동으로 광고가 게재됩니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
