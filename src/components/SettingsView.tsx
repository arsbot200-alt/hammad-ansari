import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  HardDrive,
  Clock,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Code2,
  Lock,
} from 'lucide-react';
import { StorageStats } from '../types';
import { formatBytes } from '../utils/format';

interface SettingsViewProps {
  onBack: () => void;
  stats: StorageStats | null;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenVercelModal: () => void;
  sortOption: string;
  onChangeSortOption: (val: any) => void;
  onLockApp?: () => void;
}

interface CronStatus {
  active: boolean;
  interval: string;
  lastRun: string | null;
  nextRun: string | null;
  retentionDays: number;
  features: string[];
  history: Array<{
    id: string;
    timestamp: string;
    durationMs: number;
    itemsPurged: number;
    orphansRemoved: number;
    bytesFreed: number;
    status: 'success' | 'failed';
    details: string;
  }>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  stats,
  isDarkMode,
  onToggleTheme,
  onOpenVercelModal,
  sortOption,
  onChangeSortOption,
  onLockApp,
}) => {
  const [showHidden, setShowHidden] = useState(false);
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [cronFeedback, setCronFeedback] = useState<string | null>(null);

  // Fetch cron status
  const fetchCronStatus = async () => {
    try {
      const res = await fetch('/api/cron/status');
      if (res.ok) {
        const data = await res.json();
        setCronStatus(data);
      }
    } catch (e) {
      console.error('Failed to load cron status:', e);
    }
  };

  useEffect(() => {
    fetchCronStatus();
    const interval = setInterval(fetchCronStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRunCronNow = async () => {
    if (isRunningCron) return;
    setIsRunningCron(true);
    setCronFeedback(null);
    try {
      const res = await fetch('/api/cron/run-now', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCronFeedback(data.result?.details || 'Maintenance completed successfully');
        await fetchCronStatus();
      } else {
        setCronFeedback('Maintenance job encountered an issue');
      }
    } catch (err: any) {
      setCronFeedback(err.message || 'Network error running cron');
    } finally {
      setIsRunningCron(false);
      setTimeout(() => setCronFeedback(null), 5000);
    }
  };

  const formatCronTime = (isoString?: string | null) => {
    if (!isoString) return 'Just started';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-6 pb-24 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4">
      {/* Header matching Mockup Screen 8: ArrowLeft, "Settings" */}
      <div className="flex items-center gap-3 pt-2 pb-1">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-white font-sans">
          Settings
        </h1>
      </div>

      {/* Automated Background Cron Maintenance Card */}
      <div className="p-4 rounded-2xl bg-[#131722] border border-emerald-500/30 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Automated Maintenance Cron Job</span>
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
                Active
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Background task runs automatically every 15 minutes to purge 30-day trash items and clean orphaned storage.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
          <div>
            <span className="text-zinc-500 text-[11px] block">Last Auto-Run</span>
            <span className="text-zinc-200 font-medium">
              {formatCronTime(cronStatus?.lastRun)}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 text-[11px] block">Schedule</span>
            <span className="text-emerald-400 font-medium">Every 15 mins</span>
          </div>
        </div>

        {cronFeedback && (
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{cronFeedback}</span>
          </div>
        )}

        <div className="pt-1">
          <button
            onClick={handleRunCronNow}
            disabled={isRunningCron}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-60 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRunningCron ? 'animate-spin' : ''}`} />
            <span>{isRunningCron ? 'Running Cron Cleanup...' : 'Run Cron Maintenance Now'}</span>
          </button>
        </div>
      </div>

      {/* General Section matching Screen 8 */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
          General
        </span>

        <div className="bg-[#131722] border border-zinc-800 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden text-xs">
          {/* Theme */}
          <div
            onClick={onToggleTheme}
            className="flex items-center justify-between p-3.5 hover:bg-zinc-800/40 cursor-pointer transition-colors"
          >
            <span className="font-medium text-white">Theme</span>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span>{isDarkMode ? 'Dark' : 'Light'}</span>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </div>
          </div>

          {/* Sort by */}
          <div
            onClick={() =>
              onChangeSortOption(sortOption === 'newest' ? 'oldest' : 'newest')
            }
            className="flex items-center justify-between p-3.5 hover:bg-zinc-800/40 cursor-pointer transition-colors"
          >
            <span className="font-medium text-white">Sort by</span>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span>{sortOption === 'newest' ? 'Date taken (Newest)' : 'Date taken (Oldest)'}</span>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </div>
          </div>

          {/* Show hidden albums (Toggle switch matching Screen 8) */}
          <div className="flex items-center justify-between p-3.5">
            <span className="font-medium text-white">Show hidden albums</span>
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                showHidden ? 'bg-blue-600 justify-end' : 'bg-zinc-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Cloud & API Endpoints */}
          <div
            onClick={onOpenVercelModal}
            className="flex items-center justify-between p-3.5 hover:bg-zinc-800/40 cursor-pointer transition-colors"
          >
            <span className="font-medium text-white">API Endpoints & Integration</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono text-[11px]">
              <span>Active</span>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Storage Section matching Screen 8 */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
          Storage
        </span>

        <div className="bg-[#131722] border border-zinc-800 rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between font-mono">
            <span className="text-zinc-400">Used space</span>
            <span className="text-white font-semibold">
              {stats?.formattedSize || '0 B'} / Unlimited Lossless
            </span>
          </div>

          {/* Blue progress bar matching Screen 8 */}
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(8, ((stats?.totalSizeBytes || 0) / (50 * 1024 * 1024)) * 100)
                )}%`,
              }}
            />
          </div>

          <p className="text-[11px] text-zinc-500 leading-normal">
            Zero-compression original storage. Files are kept byte-for-byte lossless.
          </p>
        </div>
      </div>

      {/* Security & App Lock Section */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
          Security & Privacy
        </span>

        <div className="bg-[#131722] border border-zinc-800 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden text-xs">
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-white">App Lock Protection</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium">
              Enabled
            </span>
          </div>

          {onLockApp && (
            <div
              onClick={onLockApp}
              className="flex items-center justify-between p-3.5 hover:bg-zinc-800/40 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                <span className="font-medium text-rose-400 group-hover:underline">Lock Gallery Now</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </div>
          )}
        </div>
      </div>

      {/* About Section matching Screen 8 */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
          About
        </span>

        <div className="bg-[#131722] border border-zinc-800 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden text-xs">
          <div className="flex items-center justify-between p-3.5">
            <span className="font-medium text-white">App version</span>
            <span className="text-zinc-400 font-mono">1.0.0</span>
          </div>

          <div className="flex items-center justify-between p-3.5 hover:bg-zinc-800/40 cursor-pointer transition-colors">
            <span className="font-medium text-white">Privacy policy</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>

          <div className="flex items-center justify-between p-3.5 hover:bg-zinc-800/40 cursor-pointer transition-colors">
            <span className="font-medium text-white">Terms of service</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
