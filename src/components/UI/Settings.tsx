import React, { useState } from 'react';
import { motion } from 'motion/react';
import { soundManager } from '../../services/soundService';

interface SettingsProps {
  onBack: () => void;
  birthDate: string | null;
  birthDateLockedUntil: string | null;
  isBirthdayLocked: boolean;
  isUpdatingAudience: boolean;
  onManageAudience: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  onBack,
  birthDate,
  birthDateLockedUntil,
  isBirthdayLocked,
  isUpdatingAudience,
  onManageAudience,
}) => {
  const [musicMuted, setMusicMuted] = useState(soundManager.getMusicMuteState());
  const [sfxMuted, setSfxMuted] = useState(soundManager.getSfxMuteState());
  const [hapticsEnabled, setHapticsEnabled] = useState(soundManager.getHapticsState());

  const handleToggleMusic = () => {
    const newState = soundManager.toggleMusic();
    setMusicMuted(newState);
    soundManager.play('tap');
  };

  const handleToggleSfx = () => {
    const newState = soundManager.toggleSfx();
    setSfxMuted(newState);
    soundManager.play('tap');
  };

  const handleToggleHaptics = () => {
    const newState = soundManager.toggleHaptics();
    setHapticsEnabled(newState);
    soundManager.play('tap');
  };

  const handleManageAudience = () => {
    soundManager.play('tap');
    onManageAudience();
  };

  const toggleKnobX = typeof window !== 'undefined' && window.innerWidth < 640 ? 36 : 44;
  const birthdayButtonLabel = !birthDate
    ? 'Set Birthday'
    : isBirthdayLocked
      ? 'Birthday Locked'
      : 'Update Birthday';
  const birthdayLockLabel = birthDateLockedUntil
    ? new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(birthDateLockedUntil))
    : null;
  const isBirthdayButtonDisabled = isUpdatingAudience || isBirthdayLocked;

  return (
    <div className="fixed inset-0 bg-white overflow-y-auto select-none">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 16px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
        }}
      >
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pb-4 sm:pb-6">
          <div className="flex flex-col landscape:flex-row items-center landscape:items-end justify-between gap-4 sm:gap-0">
            <button
              onClick={() => {
                soundManager.play('tap');
                onBack();
              }}
              className="bg-black/5 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-black/40 hover:text-black transition-colors group self-start landscape:self-auto border border-black/5"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 fill-current group-hover:-translate-x-1 transition-transform">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </button>

            <div className="text-center landscape:text-right">
              <p className="text-[8px] landscape:text-[7px] sm:text-[10px] font-black text-black/20 uppercase tracking-[0.4em] sm:tracking-[0.8em] mb-1 sm:mb-2">System Config</p>
              <h2 className="text-2xl landscape:text-2xl sm:text-5xl font-display italic tracking-tighter text-black uppercase">
                Control <span className="text-sunset-teal">Panel</span>
              </h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 mt-4 sm:mt-6">
          <div className="bg-black/5 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-black/5 group hover:bg-black/10 transition-all min-h-[132px]">
            <div className="flex flex-col">
              <p className="text-[8px] sm:text-[10px] font-black text-black/20 uppercase tracking-[0.4em] mb-1">Audio Stream</p>
              <h3 className="text-xl sm:text-3xl font-display italic text-black uppercase tracking-tighter">Music</h3>
            </div>
            <button
              onClick={handleToggleMusic}
              className={`relative shrink-0 w-16 h-8 sm:w-20 sm:h-10 rounded-full transition-all duration-300 ${musicMuted ? 'bg-black/10' : 'bg-sunset-teal'}`}
            >
              <motion.div
                animate={{ x: musicMuted ? 4 : toggleKnobX }}
                className="absolute top-1 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full shadow-lg"
              />
            </button>
          </div>

          <div className="bg-black/5 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-black/5 group hover:bg-black/10 transition-all min-h-[132px]">
            <div className="flex flex-col">
              <p className="text-[8px] sm:text-[10px] font-black text-black/20 uppercase tracking-[0.4em] mb-1">Feedback Loop</p>
              <h3 className="text-xl sm:text-3xl font-display italic text-black uppercase tracking-tighter">Sound Effects</h3>
            </div>
            <button
              onClick={handleToggleSfx}
              className={`relative shrink-0 w-16 h-8 sm:w-20 sm:h-10 rounded-full transition-all duration-300 ${sfxMuted ? 'bg-black/10' : 'bg-sunset-orange'}`}
            >
              <motion.div
                animate={{ x: sfxMuted ? 4 : toggleKnobX }}
                className="absolute top-1 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full shadow-lg"
              />
            </button>
          </div>

          <div className="bg-black/5 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-black/5 group hover:bg-black/10 transition-all min-h-[132px] lg:col-span-2">
            <div className="flex flex-col">
              <p className="text-[8px] sm:text-[10px] font-black text-black/20 uppercase tracking-[0.4em] mb-1">Tactile Response</p>
              <h3 className="text-xl sm:text-3xl font-display italic text-black uppercase tracking-tighter">Haptics</h3>
            </div>
            <button
              onClick={handleToggleHaptics}
              className={`relative shrink-0 w-16 h-8 sm:w-20 sm:h-10 rounded-full transition-all duration-300 ${!hapticsEnabled ? 'bg-black/10' : 'bg-sunset-pink'}`}
            >
              <motion.div
                animate={{ x: !hapticsEnabled ? 4 : toggleKnobX }}
                className="absolute top-1 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full shadow-lg"
              />
            </button>
          </div>

          <div className="bg-black/5 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col gap-4 border border-black/5 group hover:bg-black/10 transition-all min-h-[180px] lg:col-span-2">
            <div className="flex flex-col">
              <p className="text-[8px] sm:text-[10px] font-black text-black/20 uppercase tracking-[0.4em] mb-1">Parental Controls</p>
              <h3 className="text-xl sm:text-3xl font-display italic text-black uppercase tracking-tighter">Birthday</h3>
            </div>

            <button
              type="button"
              disabled={isBirthdayButtonDisabled}
              onClick={handleManageAudience}
              className={`w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-left transition-all hover:border-black/20 ${
                isBirthdayButtonDisabled ? 'cursor-not-allowed opacity-70' : ''
              }`}
            >
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/30">
                {isBirthdayLocked ? 'Locked' : 'Review'}
              </p>
              <p className="mt-2 text-lg font-black uppercase tracking-tight text-black">
                {birthdayButtonLabel}
              </p>
            </button>

            {isBirthdayLocked && birthdayLockLabel && (
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-black/35">
                Available again: {birthdayLockLabel}
              </p>
            )}

            {isUpdatingAudience && (
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-black/35">
                Updating ad settings...
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 sm:mt-14 flex justify-between items-center opacity-20 px-1">
          <p className="text-[7px] sm:text-[8px] font-mono text-black uppercase tracking-[0.4em] font-black">
            Settings v1.0.10
          </p>
          <p className="text-[7px] sm:text-[8px] font-mono text-black uppercase tracking-[0.4em] font-black">
            Status: Operational
          </p>
        </div>
      </motion.div>
    </div>
  );
};
