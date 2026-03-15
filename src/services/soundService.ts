import { hapticService } from './hapticService';

class SoundManager {
  private static instance: SoundManager;
  private sounds: Record<string, HTMLAudioElement> = {};
  private soundUrls: Record<string, string> = {};
  private music: HTMLAudioElement | null = null;
  private sfxPool: Record<string, HTMLAudioElement[]> = {};
  private POOL_SIZE = 5;
  
  private isMusicMuted: boolean = false;
  private isSfxMuted: boolean = false;
  private hapticsEnabled: boolean = true;
  
  private baseMusicVolume: number = 0.25;
  private baseSfxVolume: number = 0.8;
  private isDucking: boolean = false;

  private isInitialized: boolean = false;
  private constructor() {}

  private initSounds() {
    if (this.isInitialized) return;
    
    try {
      this.soundUrls = {
        pop: '/soda-pop-custom.wav',
        tap: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
        miss: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
        opening: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
      };
      
      if (typeof Audio !== 'undefined') {
        this.music = new Audio(this.soundUrls.music || 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3');
        if (this.music) {
          this.music.loop = true;
          this.music.volume = this.baseMusicVolume;
          this.music.onerror = () => console.warn('Music failed to load');
        }

        // Initialize pools and templates
        Object.entries(this.soundUrls).forEach(([name, url]) => {
          const template = new Audio(url);
          template.preload = 'auto';
          template.onerror = () => console.warn(`Sound ${name} failed to load`);
          this.sounds[name] = template;

          // Create pool
          this.sfxPool[name] = Array.from({ length: this.POOL_SIZE }, () => {
            const audio = new Audio(url);
            audio.preload = 'auto';
            return audio;
          });
        });

        // Set relative volumes for templates
        if (this.sounds.pop) this.sounds.pop.volume = 1.0;
        if (this.sounds.tap) this.sounds.tap.volume = 0.5;
        if (this.sounds.win) this.sounds.win.volume = 0.9;
        if (this.sounds.miss) this.sounds.miss.volume = 0.7;
        if (this.sounds.opening) this.sounds.opening.volume = 0.8;
      }
      
      this.isInitialized = true;
    } catch (e) {
      console.warn('Audio initialization failed:', e);
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public play(soundName: 'pop' | 'tap' | 'win' | 'miss' | 'opening') {
    this.initSounds();
    if (this.isSfxMuted) return;
    
    if (this.hapticsEnabled) {
      if (soundName === 'pop') hapticService.light();
      else if (soundName === 'miss') hapticService.heavy();
      else if (soundName === 'tap') hapticService.vibrate(5);
      else if (soundName === 'win') hapticService.success();
    }

    const pool = this.sfxPool[soundName];
    const template = this.sounds[soundName];
    
    if (pool && template) {
      // Find an available sound in the pool
      const sound = pool.find(s => s.paused || s.ended) || pool[0];
      
      sound.currentTime = 0;
      sound.volume = template.volume * this.baseSfxVolume;
      
      if (soundName === 'tap') {
        sound.playbackRate = 0.85 + Math.random() * 0.3;
      }

      sound.play().catch(() => {
        // Fallback for browsers that block auto-play
      });

      // Duck music for impactful SFX
      if (soundName === 'pop' || soundName === 'win') {
        this.duckMusic();
      }
    }
  }

  private duckMusic() {
    if (!this.music || this.isMusicMuted || this.isDucking) return;
    
    this.isDucking = true;
    const currentVol = this.music.volume;
    this.music.volume = currentVol * 0.4;
    
    setTimeout(() => {
      if (this.music && !this.isMusicMuted) {
        // Smoothly restore volume if possible, or just snap back
        this.music.volume = this.baseMusicVolume;
      }
      this.isDucking = false;
    }, 600);
  }

  public unlockAudio() {
    this.initSounds();
    const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFAmZtdCAQAAAAAQABAIAAAIAAAIABAAB3YWRhdGEAAAAA');
    silent.play().catch(() => {});
    if (this.music && !this.isMusicMuted) {
      this.music.play().catch(() => {});
    }
  }

  public startMusic() {
    this.initSounds();
    if (this.isMusicMuted || !this.music) return;
    this.music.play().catch(() => {});
  }

  public stopMusic() {
    this.music?.pause();
  }

  public toggleMusic() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isMusicMuted;
  }

  public toggleSfx() {
    this.isSfxMuted = !this.isSfxMuted;
    return this.isSfxMuted;
  }

  public getMusicMuteState() {
    return this.isMusicMuted;
  }

  public getSfxMuteState() {
    return this.isSfxMuted;
  }

  public toggleHaptics() {
    this.hapticsEnabled = !this.hapticsEnabled;
    hapticService.setEnabled(this.hapticsEnabled);
    return this.hapticsEnabled;
  }

  public getHapticsState() {
    return this.hapticsEnabled;
  }

  public setMusicIntensity(intensity: number) {
    if (!this.music || this.isMusicMuted) return;
    const rate = 1 + (intensity * 0.4);
    const vol = this.baseMusicVolume + (intensity * 0.2);
    this.music.playbackRate = rate;
    if (!this.isDucking) {
      this.music.volume = Math.min(vol, 0.6);
    }
  }
}

export const soundManager = SoundManager.getInstance();
