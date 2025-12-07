'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { App } from '@capacitor/app';
import { Suspense } from 'react';

interface DebugData {
  timestamp: string;
  windowLocation: {
    href: string;
    pathname: string;
    search: string;
    hash: string;
  } | null;
  searchParams: Record<string, string>;
  launchUrl: string | null;
  launchUrlError: string | null;
  sharedTextFromUrl: string | null;
  sharedTextFromLaunch: string | null;
  rawSharedText: string | null;
  appInfo: {
    id: string;
    name: string;
    version: string;
    build: string;
  } | null;
}

function ShareRecipeDebugContent() {
  const searchParams = useSearchParams();
  const [debugData, setDebugData] = useState<DebugData>({
    timestamp: new Date().toISOString(),
    windowLocation: null,
    searchParams: {},
    launchUrl: null,
    launchUrlError: null,
    sharedTextFromUrl: null,
    sharedTextFromLaunch: null,
    rawSharedText: null,
    appInfo: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const gatherDebugData = async () => {
      const data: DebugData = {
        timestamp: new Date().toISOString(),
        windowLocation: null,
        searchParams: {},
        launchUrl: null,
        launchUrlError: null,
        sharedTextFromUrl: null,
        sharedTextFromLaunch: null,
        rawSharedText: null,
        appInfo: null,
      };

      // 1. Window location bilgisi
      if (typeof window !== 'undefined') {
        data.windowLocation = {
          href: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        };
      }

      // 2. Search params (Next.js)
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
      data.searchParams = params;

      // 3. sharedText from URL params
      data.sharedTextFromUrl = searchParams.get('sharedText');

      // 4. Capacitor App.getLaunchUrl()
      try {
        const result = await App.getLaunchUrl();
        data.launchUrl = result?.url || 'No launch URL';
        
        if (result?.url) {
          try {
            const url = new URL(result.url);
            data.sharedTextFromLaunch = url.searchParams.get('sharedText');
          } catch (e) {
            data.launchUrlError = 'Failed to parse launch URL: ' + String(e);
          }
        }
      } catch (e) {
        data.launchUrlError = 'getLaunchUrl error: ' + String(e);
      }

      // 5. App info
      try {
        const appInfo = await App.getInfo();
        data.appInfo = appInfo;
      } catch (e) {
        // Not available on web
      }

      // 6. Raw shared text (from any source)
      data.rawSharedText = data.sharedTextFromUrl || data.sharedTextFromLaunch || null;

      setDebugData(data);
      setIsLoading(false);
    };

    gatherDebugData();

    // Listen for URL changes
    const listener = App.addListener('appUrlOpen', (event) => {
      console.log('appUrlOpen event:', event);
      setDebugData(prev => ({
        ...prev,
        timestamp: new Date().toISOString(),
        launchUrl: event.url,
      }));
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF9F7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
          <p className="text-gray-600">Veriler toplanıyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#FF6B35] mb-2">🔍 Share Intent Debug</h1>
          <p className="text-gray-400 text-sm">Instagram&apos;dan gelen veriler</p>
          <p className="text-gray-500 text-xs mt-1">{debugData.timestamp}</p>
        </div>

        {/* Shared Text - En Önemli */}
        <DebugSection title="📝 Paylaşılan Metin" highlight>
          {debugData.rawSharedText ? (
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-3">
              <p className="text-green-400 text-xs mb-2">✅ Metin başarıyla alındı!</p>
              <pre className="text-white text-sm whitespace-pre-wrap break-words">
                {debugData.rawSharedText}
              </pre>
            </div>
          ) : (
            <div className="bg-red-900/30 border border-red-500 rounded-lg p-3">
              <p className="text-red-400">❌ Paylaşılan metin bulunamadı</p>
            </div>
          )}
        </DebugSection>

        {/* URL Search Params */}
        <DebugSection title="🔗 URL Search Params">
          {Object.keys(debugData.searchParams).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(debugData.searchParams).map(([key, value]) => (
                <div key={key} className="bg-gray-800 rounded p-2">
                  <span className="text-blue-400 font-mono">{key}:</span>
                  <p className="text-gray-300 text-sm break-all mt-1">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Param yok</p>
          )}
        </DebugSection>

        {/* Window Location */}
        <DebugSection title="🌐 Window Location">
          {debugData.windowLocation ? (
            <div className="space-y-2 text-sm">
              <DebugRow label="href" value={debugData.windowLocation.href} />
              <DebugRow label="pathname" value={debugData.windowLocation.pathname} />
              <DebugRow label="search" value={debugData.windowLocation.search || '(boş)'} />
              <DebugRow label="hash" value={debugData.windowLocation.hash || '(boş)'} />
            </div>
          ) : (
            <p className="text-gray-500">Bilgi yok</p>
          )}
        </DebugSection>

        {/* Launch URL */}
        <DebugSection title="🚀 Capacitor Launch URL">
          <div className="space-y-2">
            <DebugRow label="URL" value={debugData.launchUrl || '(yok)'} />
            <DebugRow label="sharedText" value={debugData.sharedTextFromLaunch || '(yok)'} />
            {debugData.launchUrlError && (
              <div className="bg-red-900/30 rounded p-2">
                <p className="text-red-400 text-xs">{debugData.launchUrlError}</p>
              </div>
            )}
          </div>
        </DebugSection>

        {/* App Info */}
        <DebugSection title="📱 App Info">
          {debugData.appInfo ? (
            <div className="space-y-2 text-sm">
              <DebugRow label="ID" value={debugData.appInfo.id} />
              <DebugRow label="Name" value={debugData.appInfo.name} />
              <DebugRow label="Version" value={debugData.appInfo.version} />
              <DebugRow label="Build" value={debugData.appInfo.build} />
            </div>
          ) : (
            <p className="text-gray-500">Web ortamında çalışıyor</p>
          )}
        </DebugSection>

        {/* Raw Debug Data */}
        <DebugSection title="🔧 Ham JSON">
          <pre className="bg-gray-900 rounded p-3 text-xs overflow-x-auto">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </DebugSection>

        {/* Refresh Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full mt-6 py-3 bg-[#FF6B35] text-white rounded-lg font-medium hover:bg-[#e55a2b] transition-colors"
        >
          🔄 Yenile
        </button>
      </div>
    </div>
  );
}

// Helper Components
function DebugSection({ 
  title, 
  children, 
  highlight = false 
}: { 
  title: string; 
  children: React.ReactNode; 
  highlight?: boolean;
}) {
  return (
    <div className={`mb-4 rounded-lg p-4 ${highlight ? 'bg-[#16213e] border border-[#FF6B35]' : 'bg-gray-800/50'}`}>
      <h2 className="text-sm font-semibold text-gray-400 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="text-gray-200 break-all font-mono text-xs">{value}</span>
    </div>
  );
}

export default function ShareRecipePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a2e]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    }>
      <ShareRecipeDebugContent />
    </Suspense>
  );
}
