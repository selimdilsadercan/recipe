"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

interface ShareData {
  action?: string;
  type?: string;
  text?: string;
  subject?: string;
  mediaType?: string;
  mediaUri?: string;
  mediaUris?: string[];
  clipData?: Array<{ text?: string; uri?: string }>;
  allExtras?: Record<string, string>;
  isMultiple?: boolean;
}

interface DebugInfo {
  timestamp: string;
  shareData: ShareData | null;
  rawJson: string | null;
  logs: string[];
}

/**
 * ShareIntentHandler - DEBUG MODE
 * Video/Image desteği ile tüm share data'yı gösterir
 */
export function ShareIntentHandler({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    timestamp: new Date().toISOString(),
    shareData: null,
    rawJson: null,
    logs: [],
  });
  const [showDebug, setShowDebug] = useState(true);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-30), `[${timestamp}] ${message}`],
    }));
  }, []);

  useEffect(() => {
    addLog(`Mounted. isNative: ${isNative}, pathname: ${pathname}`);

    if (!isNative) {
      addLog('Not native platform');
      return;
    }

    // Check localStorage on mount
    const checkLocalStorage = () => {
      try {
        const rawData = localStorage.getItem('pendingShareData');
        const timestamp = localStorage.getItem('pendingShareDataTimestamp');
        
        if (rawData) {
          addLog(`Found pendingShareData (${rawData.length} chars)`);
          const shareData = JSON.parse(rawData) as ShareData;
          
          setDebugInfo(prev => ({
            ...prev,
            shareData,
            rawJson: rawData,
            timestamp: new Date().toISOString(),
          }));
        } else {
          addLog('No pendingShareData in localStorage');
        }
      } catch (e) {
        addLog(`LocalStorage error: ${String(e)}`);
      }
    };

    // Listen for shareIntent event
    const handleShareEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ShareData>;
      const data = customEvent.detail;
      
      addLog(`shareIntent event received: ${JSON.stringify(data).substring(0, 100)}...`);
      
      setDebugInfo(prev => ({
        ...prev,
        shareData: data,
        rawJson: JSON.stringify(data, null, 2),
        timestamp: new Date().toISOString(),
      }));
    };

    // Poll localStorage
    const pollInterval = setInterval(() => {
      const rawData = localStorage.getItem('pendingShareData');
      const timestamp = localStorage.getItem('pendingShareDataTimestamp');
      
      if (rawData && timestamp) {
        const savedTimestamp = parseInt(timestamp, 10);
        const age = Date.now() - savedTimestamp;
        
        if (age < 30000) {
          addLog(`Poll found new data (age: ${age}ms)`);
          
          try {
            const shareData = JSON.parse(rawData) as ShareData;
            setDebugInfo(prev => ({
              ...prev,
              shareData,
              rawJson: rawData,
              timestamp: new Date().toISOString(),
            }));
            
            // Clear after reading
            localStorage.removeItem('pendingShareData');
            localStorage.removeItem('pendingShareDataTimestamp');
          } catch (e) {
            addLog(`Parse error: ${String(e)}`);
          }
        }
      }
    }, 500);

    checkLocalStorage();
    window.addEventListener('shareIntent', handleShareEvent);

    return () => {
      window.removeEventListener('shareIntent', handleShareEvent);
      clearInterval(pollInterval);
    };
  }, [addLog, pathname]);

  const clearData = () => {
    localStorage.removeItem('pendingShareData');
    localStorage.removeItem('pendingShareDataTimestamp');
    setDebugInfo(prev => ({
      ...prev,
      shareData: null,
      rawJson: null,
    }));
    addLog('Data cleared');
  };

  return (
    <>
      {children}
      
      {/* Debug Overlay */}
      {showDebug && (
        <div className="fixed inset-0 bg-black/95 z-[9999] overflow-auto p-4">
          <div className="max-w-lg mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-[#FF6B35]">🔍 Share Debug v3</h1>
              <button
                onClick={() => setShowDebug(false)}
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
              >
                Gizle
              </button>
            </div>
            
            {/* Status */}
            <div className="bg-gray-800 rounded-lg p-3 mb-3">
              <p className="text-gray-400 text-xs mb-1">Status</p>
              <p className="text-white text-sm">
                isNative: <span className={isNative ? 'text-green-400' : 'text-red-400'}>{String(isNative)}</span>
              </p>
              <p className="text-gray-500 text-xs mt-1">{debugInfo.timestamp}</p>
            </div>
            
            {/* Share Data Summary */}
            {debugInfo.shareData && (
              <div className="bg-green-900/30 border border-green-500 rounded-lg p-3 mb-3">
                <p className="text-gray-400 text-xs mb-2">📦 Share Data</p>
                <div className="space-y-1 text-sm">
                  <p className="text-white">
                    <span className="text-gray-400">action:</span> {debugInfo.shareData.action}
                  </p>
                  <p className="text-white">
                    <span className="text-gray-400">type:</span>{' '}
                    <span className="text-yellow-400">{debugInfo.shareData.type}</span>
                  </p>
                  {debugInfo.shareData.text && (
                    <div>
                      <p className="text-gray-400">text:</p>
                      <p className="text-green-400 break-all">{debugInfo.shareData.text}</p>
                    </div>
                  )}
                  {debugInfo.shareData.subject && (
                    <p className="text-white">
                      <span className="text-gray-400">subject:</span> {debugInfo.shareData.subject}
                    </p>
                  )}
                  {debugInfo.shareData.mediaType && (
                    <p className="text-white">
                      <span className="text-gray-400">mediaType:</span>{' '}
                      <span className="text-purple-400">{debugInfo.shareData.mediaType}</span>
                    </p>
                  )}
                  {debugInfo.shareData.mediaUri && (
                    <div>
                      <p className="text-gray-400">mediaUri:</p>
                      <p className="text-blue-400 break-all text-xs">{debugInfo.shareData.mediaUri}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* All Extras */}
            {debugInfo.shareData?.allExtras && (
              <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-3 mb-3">
                <p className="text-gray-400 text-xs mb-2">🔧 All Intent Extras</p>
                <div className="space-y-1 text-xs">
                  {Object.entries(debugInfo.shareData.allExtras).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-700 pb-1">
                      <p className="text-blue-400 font-mono">{key}:</p>
                      <p className="text-white break-all">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* ClipData */}
            {debugInfo.shareData?.clipData && debugInfo.shareData.clipData.length > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-3 mb-3">
                <p className="text-gray-400 text-xs mb-2">📎 ClipData Items ({debugInfo.shareData.clipData.length})</p>
                {debugInfo.shareData.clipData.map((item, i) => (
                  <div key={i} className="text-xs mb-2 bg-gray-800 p-2 rounded">
                    <p className="text-gray-400">Item {i}:</p>
                    {item.text && <p className="text-white">text: {item.text}</p>}
                    {item.uri && <p className="text-blue-400 break-all">uri: {item.uri}</p>}
                  </div>
                ))}
              </div>
            )}
            
            {/* Raw JSON */}
            {debugInfo.rawJson && (
              <div className="bg-gray-900 rounded-lg p-3 mb-3">
                <p className="text-gray-400 text-xs mb-2">📄 Raw JSON</p>
                <pre className="text-xs text-gray-300 overflow-auto max-h-40 whitespace-pre-wrap">
                  {JSON.stringify(debugInfo.shareData, null, 2)}
                </pre>
              </div>
            )}
            
            {/* No Data */}
            {!debugInfo.shareData && (
              <div className="bg-gray-800 rounded-lg p-3 mb-3">
                <p className="text-gray-500 text-center">Share data yok</p>
                <p className="text-gray-600 text-xs text-center mt-1">Instagram&apos;dan bir reel paylaş</p>
              </div>
            )}
            
            {/* Logs */}
            <div className="bg-gray-900 rounded-lg p-3 mb-3">
              <p className="text-gray-400 text-xs mb-2">📋 Logs</p>
              <div className="space-y-1 max-h-32 overflow-auto">
                {debugInfo.logs.map((log, i) => (
                  <p key={i} className="text-gray-300 text-xs font-mono">{log}</p>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 bg-[#FF6B35] text-white rounded-lg text-sm"
              >
                🔄 Yenile
              </button>
              <button
                onClick={clearData}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm"
              >
                🗑️ Temizle
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Show Debug Button */}
      {!showDebug && (
        <button
          onClick={() => setShowDebug(true)}
          className="fixed bottom-24 right-4 z-[9999] w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center shadow-lg"
        >
          <span className="text-xl">🔍</span>
        </button>
      )}
    </>
  );
}
