import { AdMob, RewardAdPluginEvents, type AdOptions, type RewardAdOptions } from '@capacitor-community/admob';
import type { PluginListenerHandle } from '@capacitor/core';

const IS_DEV = import.meta.env.DEV;

const INTERSTITIAL_ID = IS_DEV
  ? 'ca-app-pub-3940256099942544/1033173712'
  : import.meta.env.VITE_ADMOB_INTERSTITIAL_ID;

const REWARDED_ID = IS_DEV
  ? 'ca-app-pub-3940256099942544/5224354917'
  : import.meta.env.VITE_ADMOB_REWARDED_ID;

const INTERSTITIAL_FREQUENCY = 3;

let gameCount = 0;
let isInitialized = false;

const removeListeners = async (handles: PluginListenerHandle[]) => {
  await Promise.all(handles.map((handle) => handle.remove()));
};

export const adService = {
  async initialize(): Promise<void> {
    if (isInitialized) {
      return;
    }

    if (!INTERSTITIAL_ID || !REWARDED_ID) {
      console.warn('AdMob ad unit IDs are missing. Ads will be disabled.');
      return;
    }

    await AdMob.initialize({
      initializeForTesting: import.meta.env.DEV,
      testingDevices: import.meta.env.DEV ? ['EMULATOR'] : [],
    });

    isInitialized = true;
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
  }
};
