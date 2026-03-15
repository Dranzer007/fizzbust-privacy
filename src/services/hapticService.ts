export class HapticService {
  private static instance: HapticService;
  private enabled: boolean = true;

  private constructor() {
    this.enabled = typeof navigator !== 'undefined' && !!navigator.vibrate;
  }

  public static getInstance(): HapticService {
    if (!HapticService.instance) {
      HapticService.instance = new HapticService();
    }
    return HapticService.instance;
  }

  public vibrate(pattern: number | number[]): void {
    if (this.enabled) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn('Haptic feedback failed:', e);
      }
    }
  }

  public light(): void {
    this.vibrate(10);
  }

  public medium(): void {
    this.vibrate(30);
  }

  public heavy(): void {
    this.vibrate(60);
  }

  public success(): void {
    this.vibrate([10, 30, 10]);
  }

  public error(): void {
    this.vibrate([50, 100, 50]);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled && typeof navigator !== 'undefined' && !!navigator.vibrate;
  }
}

export const hapticService = HapticService.getInstance();
