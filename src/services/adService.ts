// Simple service to manage ad logic and frequency
class AdService {
  private gameCount: number = 0;
  private readonly INTERSTITIAL_FREQUENCY: number = 3; // Show every 3 games
  private isSdkInitialized: boolean = false;

  constructor() {
    // Simulate SDK initialization
    setTimeout(() => {
      this.isSdkInitialized = true;
      console.log('📱 Mobile Ads SDK Initialized');
    }, 1000);
  }

  incrementGameCount() {
    this.gameCount++;
  }

  shouldShowInterstitial(): boolean {
    return this.gameCount % this.INTERSTITIAL_FREQUENCY === 0 && this.gameCount > 0;
  }

  // Mock function for showing an interstitial
  async showInterstitial(): Promise<boolean> {
    if (!this.isSdkInitialized) return true;
    
    console.log('🎬 Requesting Interstitial Ad...');
    // In a real app, this would call:
    // AdMob.showInterstitial(AD_UNIT_ID)
    
    return new Promise((resolve) => {
      // Simulate ad loading and showing
      setTimeout(() => {
        console.log('✅ Interstitial Ad Dismissed');
        resolve(true);
      }, 1500);
    });
  }

  // Mock function for rewarded ads
  async showRewardedAd(): Promise<boolean> {
    if (!this.isSdkInitialized) {
      alert("Ads system not ready. Please try again in a moment.");
      return false;
    }

    console.log('💎 Requesting Rewarded Ad...');
    // In a real app, this would call:
    // AdMob.showRewardedAd(AD_UNIT_ID)
    
    return new Promise((resolve) => {
      // Simulate ad loading and showing
      setTimeout(() => {
        console.log('✅ Rewarded Ad Completed');
        resolve(true);
      }, 2000);
    });
  }
}

export const adService = new AdService();
