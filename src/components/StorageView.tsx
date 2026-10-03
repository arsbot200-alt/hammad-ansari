import React from 'react';
import {
  HardDrive,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Download,
  Trash2,
} from 'lucide-react';
import { StorageStats, ImageRecord } from '../types';
import { formatBytes } from '../utils/format';

interface StorageViewProps {
  stats: StorageStats | null;
  images: ImageRecord[];
  onExportAllZip: () => void;
  isDarkMode: boolean;
}

export const StorageView: React.FC<StorageViewProps> = ({
  stats,
  images,
  onExportAllZip,
  isDarkMode,
}) => {
  const totalBytes = stats?.totalSizeBytes || 0;
  const totalCount = stats?.totalImages || 0;

  // Breakdown by mime type
  const formatMap = new Map<string, { count: number; bytes: number }>();
  images.forEach((img) => {
    const ext = img.mimeType || 'unknown';
    const cur = formatMap.get(ext) || { count: 0, bytes: 0 };
    cur.count++;
    cur.bytes += img.sizeBytes;
    formatMap.set(ext, cur);
  });

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      <div>
        <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Storage & Zero-Compression Engine
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Complete transparent accounting of pristine files stored byte-for-byte without transcoding.
        </p>
      </div>

      {/* Main Meter Card */}
      <div
        className={`p-6 rounded-3xl border ${
          isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Total Space Utilized
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400 font-mono">
                {stats?.formattedSize || '0 B'}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                ({totalBytes.toLocaleString()} bytes)
              </span>
            </div>
          </div>

          <button
            onClick={onExportAllZip}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full shadow-sm transition-all hover:scale-[1.02] ${
              isDarkMode
                ? 'bg-amber-400 text-black hover:bg-amber-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download All as Full ZIP Archive</span>
          </button>
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-800/60 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">0% Lossy Compression</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Every byte from your original upload stream is written directly to disk.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">SHA-256 Hash Integrity</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Cryptographic checksums generated upon arrival to verify zero bit rot.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Vercel & Node Optimized</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Runs on standard server or Vercel serverless without memory leaks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Format Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-300">Format Distribution</h3>
        <div className="border border-zinc-800 rounded-2xl overflow-hidden text-xs">
          <table className="w-full text-left font-mono">
            <thead className={`text-[11px] ${isDarkMode ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
              <tr>
                <th className="p-3">MIME Format</th>
                <th className="p-3">File Count</th>
                <th className="p-3">Disk Usage</th>
                <th className="p-3">Fidelity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {Array.from(formatMap.entries()).map(([mime, data]) => (
                <tr key={mime} className={isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}>
                  <td className="p-3 font-semibold">{mime}</td>
                  <td className="p-3">{data.count}</td>
                  <td className="p-3 text-amber-400 font-semibold">{formatBytes(data.bytes)}</td>
                  <td className="p-3 text-emerald-400">100% Raw</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
