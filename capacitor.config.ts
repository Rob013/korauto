import { defineConfig } from '@capacitor/cli';

const config: defineConfig = {
  appId: 'app.lovable.23abb83650154f11bf0037bd5abd247a',
  appName: 'korauto',
  webDir: 'dist',
  server: {
    url: 'https://23abb836-5015-4f11-bf00-37bd5abd247a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;