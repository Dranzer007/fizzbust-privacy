import React from 'react';

interface AgeGateProps {
  initialBirthDate?: string | null;
  isSubmitting: boolean;
  canCancel?: boolean;
  onCancel?: () => void;
  onSubmit: (birthDate: string) => void;
}

export const AgeGate: React.FC<AgeGateProps> = ({
  initialBirthDate = '',
  isSubmitting,
  canCancel = false,
  onCancel,
  onSubmit,
}) => {
  const [birthDate, setBirthDate] = React.useState(initialBirthDate ?? '');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setBirthDate(initialBirthDate ?? '');
  }, [initialBirthDate]);

  const handleSubmit = () => {
    if (!birthDate) {
      setError('Enter a valid date of birth.');
      return;
    }

    const selectedDate = new Date(`${birthDate}T00:00:00`);
    const now = new Date();
    if (Number.isNaN(selectedDate.getTime()) || selectedDate > now) {
      setError('Enter a valid date of birth.');
      return;
    }

    setError('');
    onSubmit(birthDate);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-white/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-black/10 bg-white shadow-2xl p-6 sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.45em] text-black/30 mb-3">
          Privacy Setup
        </p>
        <h2 className="text-3xl sm:text-4xl font-display italic uppercase tracking-tight text-black mb-3">
          Confirm Birthday
        </h2>
        <p className="text-sm leading-relaxed text-black/60 mb-6">Enter your date of birth to continue.</p>

        <label className="block mb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.35em] text-black/30">Date Of Birth</span>
          <input
            type="date"
            value={birthDate}
            disabled={isSubmitting}
            onChange={(event) => {
              setBirthDate(event.target.value);
              if (error) {
                setError('');
              }
            }}
            className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-4 text-sm font-semibold text-black outline-none focus:border-black/30 disabled:cursor-wait disabled:opacity-60"
          />
        </label>

        {error && (
          <p className="mb-4 text-xs font-semibold text-red-500">{error}</p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full rounded-2xl bg-black text-white px-5 py-4 text-sm font-black uppercase tracking-[0.2em] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
          >
            Continue
          </button>

          {canCancel && onCancel && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="w-full rounded-2xl bg-black/5 text-black px-5 py-4 text-sm font-black uppercase tracking-[0.2em] transition-colors hover:bg-black/10 disabled:cursor-wait disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>

        {isSubmitting && (
          <p className="mt-4 text-xs font-mono uppercase tracking-[0.25em] text-black/40">
            Saving birth date and updating privacy settings...
          </p>
        )}
      </div>
    </div>
  );
};
