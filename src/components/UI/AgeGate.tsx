import React from 'react';
import type { AdAudience } from '../../services/adService';

interface AgeGateProps {
  isSubmitting: boolean;
  onSelect: (audience: AdAudience) => void;
}

export const AgeGate: React.FC<AgeGateProps> = ({ isSubmitting, onSelect }) => {
  return (
    <div className="fixed inset-0 z-[300] bg-white/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-black/10 bg-white shadow-2xl p-6 sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.45em] text-black/30 mb-3">
          Audience Check
        </p>
        <h2 className="text-3xl sm:text-4xl font-display italic uppercase tracking-tight text-black mb-3">
          Select Age Group
        </h2>
        <p className="text-sm leading-relaxed text-black/60 mb-6">
          We use this selection to request the right ad experience and show consent prompts before any ads
          appear.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onSelect('under13')}
            className="w-full rounded-2xl bg-black text-white px-5 py-4 text-sm font-black uppercase tracking-[0.2em] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
          >
            Under 13
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onSelect('13plus')}
            className="w-full rounded-2xl bg-black/5 text-black px-5 py-4 text-sm font-black uppercase tracking-[0.2em] transition-colors hover:bg-black/10 disabled:cursor-wait disabled:opacity-60"
          >
            13 Or Older
          </button>
        </div>

        {isSubmitting && (
          <p className="mt-4 text-xs font-mono uppercase tracking-[0.25em] text-black/40">
            Preparing ads and consent flow...
          </p>
        )}
      </div>
    </div>
  );
};
