"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY - Auth will not work");
}

const isNative = Capacitor.isNativePlatform();

function DeepLinkHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isNative) return;

    const setupDeepLinkListener = async () => {
      const handle = await App.addListener('appUrlOpen', async (event) => {
        console.log('Deep link received:', event.url);

        try {
          const url = new URL(event.url);
          const path = url.pathname; // e.g. /oauth-native-callback or //oauth-native-callback
          const searchParam = url.search; // e.g. ?code=...&state=...
          
          // Android might give com.recipe.app://oauth-native-callback
          // Handle various URL formats standard in Deep Links
          
          if (url.host === 'oauth-native-callback' || path.includes('oauth-native-callback')) {
            console.log('OAuth callback received, navigating to handler...');
            
            // Construct the internal route path with query params
            // Ensure we keep the 'code' and 'state' parameters!
            const route = `/oauth-native-callback${searchParam}`;
            console.log('Navigating to:', route);
            
            // Force navigation
            router.push(route);
          }
          
          // Handle share-recipe deep link (from Instagram share)
          if (url.host === 'share-recipe' || path.includes('share-recipe')) {
            console.log('Share recipe deep link received...');
            
            const route = `/share-recipe${searchParam}`;
            console.log('Navigating to:', route);
            
            router.push(route);
          }
          
          // Handle create-recipe deep link (fallback)
          if (url.host === 'create-recipe' || path.includes('create-recipe')) {
            console.log('Create recipe deep link received...');
            
            const route = `/create-recipe${searchParam}`;
            console.log('Navigating to:', route);
            
            router.push(route);
          }
        } catch (err) {
          console.error('Error handling deep link:', err);
        }
      });

      return () => {
        handle.remove();
      };
    };

    setupDeepLinkListener();
  }, [router]);

  return <>{children}</>;
}

export function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY || ""}
      afterSignOutUrl="/"
      // It's crucial for mobile that we don't rely only on standard browser navigation for OAuth
      // But Clerk's redirectUrl param in signIn() handles the return URL.
      routerPush={(to) => router.push(to)}
      routerReplace={(to) => router.replace(to)}
    >
      <DeepLinkHandler>
        {children}
      </DeepLinkHandler>
    </ClerkProvider>
  );
}
