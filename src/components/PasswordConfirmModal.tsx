import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, ShieldAlert, CheckCircle2, KeyRound } from 'lucide-react';

export const ADMIN_PASSWORD_PIN = '1234';

interface PasswordConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({
  isOpen,
  title,
  description,
  actionLabel = 'Confirm & Proceed',
  isDanger = true,
  onConfirm,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === ADMIN_PASSWORD_PIN) {
      setPin('');
      setError('');
      onConfirm();
    } else {
      setError('Incorrect 4-digit password. Please enter the correct PIN.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className={`p-4 text-white flex items-center justify-between border-b ${
          isDanger ? 'bg-rose-950 border-rose-900' : 'bg-[#181824] border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDanger
                ? 'bg-rose-900/60 text-rose-300 border-rose-800'
                : 'bg-slate-800 text-[#38CE3C] border-slate-700'
            }`}>
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Security Password Required</h3>
              <p className="text-[11px] text-slate-300">Enter 4-digit admin PIN to authorize</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className={`p-3.5 rounded-xl border text-xs ${
            isDanger
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-start gap-2.5">
              <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${isDanger ? 'text-rose-600' : 'text-amber-600'}`} />
              <div>
                <p className="font-extrabold text-xs sm:text-sm">{title}</p>
                <p className="mt-1 text-[11px] opacity-90 leading-relaxed">{description}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Enter 4-Digit Password *</span>
            </label>
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              required
              value={pin}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(digitsOnly);
                if (error) setError('');
              }}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-[0.6em] font-extrabold px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-slate-900 text-slate-900 font-mono"
            />
            {error && (
              <p className="text-xs font-bold text-rose-600 mt-1.5 text-center">
                {error}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pin.length < 4}
              className={`flex-1 py-2.5 px-4 text-xs font-bold text-white rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#181824] hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
