import { config as loadEnv } from 'dotenv';
import type { CapacitorConfig } from '@capacitor/cli';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.example', override: false });

const config: CapacitorConfig = {
  appId: 'com.fizzbust.app',
  appName: 'Fizz Bust',
  webDir: 'dist',
  plugins: {
    AdMob: {
      appId: process.env.VITE_ADMOB_APP_ID,
    },
  },
};

export default config;
