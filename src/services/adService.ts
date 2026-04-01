import {
  AdMob,
  MaxAdContentRating,
  RewardAdPluginEvents,
  type AdOptions,
  type RewardAdOptions,
} from '@capacitor-community/admob';
import type { PluginListenerHandle } from '@capacitor/core';

const IS_DEV = import.meta.env.DEV;
const AD_AUDIENCE_STORAGE_KEY = 'fizz_bust_ad_audience';

export type AdAudience = 'under13' | '13plus';

const INTERSTITIAL_ID = IS_DEV
  ? 'ca-app-pub-3940256099942544/1033173712'
  : import.meta.env.VITE_ADMOB_INTERSTITIAL_ID;

const REWARDED_ID = IS_DEV
  ? 'ca-app-pub-3940256099942544/5224354917'
  : import.meta.env.VITE_ADMOB_REWARDED_ID;

const INTERSTITIAL_FREQUENCY = 3;
const TESTING_DEVICES = IS_DEV ? ['EMULATOR'] : [];

let gameCount = 0;
let isInitialized = false;
let initializedAudience: AdAudience | null = null;
let initializingAudience: AdAudience | null = null;
let initializationPromise: Promise<void> | null = null;
let canRequestAds = false;

const removeListeners = async (handles: PluginListenerHandle[]) => {
  await Promise.all(handles.map((handle) => handle.remove()));
};

const isKnownAudience = (value: string | null): value is AdAudience => {
  return value === 'under13' || value === '13plus';
};

const getStoredAudience = (): AdAudience | null => {
  try {
    const storedValue = localStorage.getItem(AD_AUDIENCE_STORAGE_KEY);
    return isKnownAudience(storedValue) ? storedValue : null;
  } catch (error) {
    console.warn('Failed to read ad audience preference:', error);
    return null;
  }
};

const buildInitializationOptions = (audience: AdAudience) => {
  if (audience === 'under13') {
    return {
      initializeForTesting: IS_DEV,
      testingDevices: TESTING_DEVICES,
      tagForChildDirectedTreatment: true,
      maxAdContentRating: MaxAdContentRating.General,
    };
  }

  return {
    initializeForTesting: IS_DEV,
    testingDevices: TESTING_DEVICES,
  };
};

const runConsentFlow = async (audience: AdAudience): Promise<void> => {
  if (audience === 'under13') {
    canRequestAds = false;
    return;
  }

  let consentInfo = await AdMob.requestConsentInfo({
    tagForUnderAgeOfConsent: false,
  });

  if (!consentInfo.canRequestAds && consentInfo.isConsentFormAvailable) {
    consentInfo = await AdMob.showConsentForm();
  }

  canRequestAds = consentInfo.canRequestAds;
};

export const adService = {
  getStoredAudience(): AdAudience | null {
    return getStoredAudience();
  },

  saveAudienceSelection(audience: AdAudience): void {
    try {
      localStorage.setItem(AD_AUDIENCE_STORAGE_KEY, audience);
    } catch (error) {
      console.warn('Failed to persist ad audience preference:', error);
    }
  },

  async initialize(audience?: AdAudience): Promise<void> {
    const resolvedAudience = audience ?? getStoredAudience();
    if (!resolvedAudience) {
      console.warn('Ad audience preference has not been selected yet.');
      return;
    }

    if (!INTERSTITIAL_ID && !REWARDED_ID) {
      console.warn('AdMob ad unit IDs are missing. Ads will be disabled.');
      return;
    }

    if (isInitialized && initializedAudience === resolvedAudience) {
      return;
    }

    if (initializationPromise && initializingAudience === resolvedAudience) {
      await initializationPromise;
      return;
    }

    initializingAudience = resolvedAudience;
    initializationPromise = (async () => {
      await AdMob.initialize(buildInitializationOptions(resolvedAudience));
      initializedAudience = resolvedAudience;
      isInitialized = true;
      await runConsentFlow(resolvedAudience);
    })();

    try {
      await initializationPromise;
    } finally {
      if (initializationPromise) {
        initializationPromise = null;
        initializingAudience = null;
      }
    }
  },

  canServeAds(): boolean {
    return isInitialized && initializedAudience === '13plus' && canRequestAds;
  },

  incrementGameCount(): void {
    gameCount += 1;
  },

  shouldShowInterstitial(): boolean {
    return gameCount > 0 && gameCount % INTERSTITIAL_FREQUENCY === 0;
  },

  async showInterstitial(): Promise<void> {
    if (!INTERSTITIAL_ID) {
      console.warn('Missing AdMob interstitial ID.');
      return;
    }

    try {
      await this.initialize();

      if (!this.canServeAds()) {
        return;
      }

      const options: AdOptions = { adId: INTERSTITIAL_ID };
      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
    } catch (error) {
      // removed for production
    }
  },

  async showRewarded(): Promise<boolean> {
    if (!REWARDED_ID) {
      console.warn('Missing AdMob rewarded ID.');
      return false;
    }

    await this.initialize();

    if (!this.canServeAds()) {
      return false;
    }

    const options: RewardAdOptions = { adId: REWARDED_ID };
    let rewardEarned = false;
    let settled = false;
    let listeners: PluginListenerHandle[] = [];
    let resolveReward: (value: boolean) => void = () => {};

    const rewardPromise = new Promise<boolean>((resolve) => {
      resolveReward = resolve;
    });

    const settle = async (result: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      await removeListeners(listeners);
      resolveReward(result);
    };

    listeners = await Promise.all([
      AdMob.addListener(RewardAdPluginEvents.Rewarded, async () => {
        rewardEarned = true;
      }),
      AdMob.addListener(RewardAdPluginEvents.Dismissed, async () => {
        await settle(rewardEarned);
      }),
      AdMob.addListener(RewardAdPluginEvents.FailedToShow, async () => {
        await settle(false);
      }),
      AdMob.addListener(RewardAdPluginEvents.FailedToLoad, async () => {
        await settle(false);
      }),
    ]);

    try {
      await AdMob.prepareRewardVideoAd(options);
      const rewardItem = await AdMob.showRewardVideoAd();
      rewardEarned = Boolean(rewardItem);
    } catch (error) {
      // removed for production
      await settle(false);
    }

    return rewardPromise;
  },

  async showRewardedAd(): Promise<boolean> {
    return this.showRewarded();
  },

  async showInterstitialEvery3Games(currentGameCount: number): Promise<void> {
    if (currentGameCount % INTERSTITIAL_FREQUENCY === 0) {
      await this.showInterstitial();
    }
  },
};
