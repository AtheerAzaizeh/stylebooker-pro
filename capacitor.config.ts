import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meabarber.app',
  appName: 'MEAbarber',
  webDir: 'dist',
  server: {
    url: 'https://mea-barber.com/',
allowNavigation: [
      'www.mea-barber.com', 
      '*.mea-barber.com',
      'mea-barber.com'
    ],
    cleartext: true
  }
};

export default config;
