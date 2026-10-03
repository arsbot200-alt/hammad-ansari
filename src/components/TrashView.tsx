import React, { useState } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Circle,
  FileImage,
} from 'lucide-react';
import { ImageRecord } from '../types';
import { formatBytes, formatDate, getSafeImageUrl } from '../utils/format';

interface TrashViewProps {
  trashedImages: ImageRecord[];
  onBack: () => void;
  onRestore: (ids: string[]) => Promise<void>;
  onPermanentDelete: (ids: string[]) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
}

export const TrashView: React.FC<TrashViewProps> = ({
  trashedImages,
  onBack,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRestore = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    await onRestore(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Permanently delete ${selectedIds.size} photos from disk?`)) {
      setIsProcessing(true);
      await onPermanentDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4">
      {/* Header matching Mockup Screen 7: ArrowLeft, "Trash", MoreVertical */}
      <div className="flex items-center justify-between pt-2 pb-1 relative">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-white font-sans">
            Trash
          </h1>
        </div>

        <button
          onClick={() => setShowMenu((prev) => !prev)}
          className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-12 w-48 bg-[#171b26] border border-zinc-800 rounded-xl p-1.5 shadow-xl z-50 text-xs">
            <button
              onClick={() => {
                if (confirm('Empty trash permanently?')) {
                  onEmptyTrash();
                  setShowMenu(false);
                }
              }}
              disabled={trashedImages.length === 0}
              className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-950/40 rounded-lg disabled:opacity-40"
            >
              Empty Trash Now
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400">
        Items in the trash will be deleted after 30 days.
      </p>

      {/* Trashed Items List matching Mockup Screen 7 */}
      {trashedImages.length === 0 ? (
        <div className="py-24 text-center text-zinc-500 text-xs">
          Trash is currently empty
        </div>
      ) : (
        <div className="space-y-2 pt-2">
          {trashedImages.map((img) => {
            const isSelected = selectedIds.has(img.id);

            return (
              <div
                key={img.id}
                onClick={() => toggleSelect(img.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-blue-600/10 border-blue-500/50'
                    : 'bg-[#131722] border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Left Thumbnail + Filename + Date & Size */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-13 h-13 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                    <img
                      src={getSafeImageUrl(img)}
                      alt={img.originalName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `/api/raw/${img.id}`;
                      }}
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate max-w-[190px] sm:max-w-xs">
                      {img.originalName}
                    </h4>
                    <p className="text-[11px] font-mono text-zinc-400">
                      {formatDate(img.uploadedAt)} · {formatBytes(img.sizeBytes)}
                    </p>
                  </div>
                </div>

                {/* Right Selection Radio Circle matching Screen 7 */}
                <div className="p-1 shrink-0">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Bar matching Mockup Screen 7: "Restore" and "Delete" */}
      {trashedImages.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-sm sm:max-w-md mx-auto z-40 flex items-center justify-between gap-3 p-2 bg-[#121520]/95 border border-zinc-800 rounded-full shadow-2xl backdrop-blur-md">
          <button
            onClick={handleRestore}
            disabled={selectedIds.size === 0 || isProcessing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restore {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={selectedIds.size === 0 || isProcessing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm shadow-red-600/30"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</span>
          </button>
        </div>
      )}
    </div>
  );
};
