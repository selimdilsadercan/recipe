import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';

export function useShareIntent() {
  const [sharedText, setSharedText] = useState<string | null>(null);

  useEffect(() => {
    // Check for initial share intent
    const checkShareIntent = async () => {
      try {
        const result = await App.getLaunchUrl();
        if (result?.url) {
          const url = new URL(result.url);
          const text = url.searchParams.get('sharedText');
          if (text) {
            setSharedText(decodeURIComponent(text));
          }
        }
      } catch (error) {
        console.error('Error checking share intent:', error);
      }
    };

    checkShareIntent();

    // Listen for app URL open events (when app is already running)
    const listener = App.addListener('appUrlOpen', (event) => {
      try {
        const url = new URL(event.url);
        const text = url.searchParams.get('sharedText');
        if (text) {
          setSharedText(decodeURIComponent(text));
        }
      } catch (error) {
        console.error('Error handling app URL open:', error);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  return sharedText;
}
