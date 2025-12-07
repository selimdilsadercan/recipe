import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.recipe.app',
  appName: 'recipe',
  webDir: 'out',
  plugins: {
    StatusBar: {
      backgroundColor: '#FAF9F7',
      overlaysWebView: false
    },
    App: {
      // Enable deep linking
    }
  },
  android: {
    backgroundColor: '#FAF9F7',
    // Allow mixed content for OAuth
    allowMixedContent: true
  },
  ios: {
    backgroundColor: '#FAF9F7'
  }
};

export default config;
