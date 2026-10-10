import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
}

export const APP_PASSWORD = 'tasbeelgillani';
export const AUTH_STORAGE_KEY = 'gallery_auth_unlocked';

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on load
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (password === APP_PASSWORD) {
      setIsSuccess(true);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      } catch (e) {}

      setTimeout(() => {
        onUnlock();
      }, 500);
    } else {
      setIsShaking(true);
      setError('Incorrect password. Access denied.');
      setTimeout(() => setIsShaking(false), 500);
      if (inputRef.current) {
        inputRef.current.select();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080a0f] text-white px-4 selection:bg-blue-600">
      {/* Background ambient glowing gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div
        className={`w-full max-w-sm relative z-10 p-8 rounded-3xl bg-[#131722]/90 border border-zinc-800 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
        }`}
      >
        {/* Animated Lock Icon */}
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isSuccess
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 scale-105'
                : error
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-zinc-800/80 text-blue-400 border border-zinc-700/60 shadow-inner'
            }`}
          >
            {isSuccess ? (
              <Unlock className="w-8 h-8 animate-bounce" />
            ) : (
              <Lock className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center justify-center gap-2">
              <span>Private Gallery</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </h1>
            <p className="text-xs text-zinc-400">
              Please enter the passcode to access your memories
            </p>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-zinc-500 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter password"
                className={`w-full bg-zinc-900/90 border rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder-zinc-500 focus:outline-hidden transition-all font-mono tracking-wider ${
                  error
                    ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20'
                    : isSuccess
                    ? 'border-emerald-500 focus:border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-zinc-400 hover:text-white p-1 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {error && (
              <p className="text-[11px] text-rose-400 pl-1 font-medium animate-in fade-in">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!password || isSuccess}
            className={`w-full py-3 px-4 rounded-2xl font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
              isSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            <span>{isSuccess ? 'Unlocked!' : 'Unlock Gallery'}</span>
            {!isSuccess && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-800/60 text-center">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
            Encrypted & Protected
          </span>
        </div>
      </div>
    </div>
  );
};
