import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, X, CheckCircle, AlertCircle, FileImage, Plus, Tag as TagIcon } from 'lucide-react';
import { UploadQueueItem } from '../types';
import { formatBytes } from '../utils/format';

interface DropZoneProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  existingTags: string[];
}

export const DropZone: React.FC<DropZoneProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  existingTags,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [customTag, setCustomTag] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newItems: UploadQueueItem[] = [];
    const validTypes = ['image/', 'application/octet-stream'];

    Array.from(files).forEach((file) => {
      // Accept all image types or files with image extensions
      const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|avif|tiff|raw|cr2|nef|arw|dng|heic)$/i.test(file.name);
      if (isImg) {
        let previewUrl: string | undefined;
        try {
          previewUrl = URL.createObjectURL(file);
        } catch {
          // ignore
        }
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'pending',
          previewUrl,
        });
      }
    });

    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);
    }
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeQueueItem = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearQueue = () => {
    queue.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setQueue([]);
  };

  const startUpload = async () => {
    const pendingItems = queue.filter((i) => i.status === 'pending');
    if (pendingItems.length === 0) return;

    setIsUploading(true);
    const tagToUse = customTag.trim() || selectedTag || undefined;

    // Upload in concurrent batches of 4
    const batchSize = 4;
    for (let i = 0; i < pendingItems.length; i += batchSize) {
      const batch = pendingItems.slice(i, i + batchSize);
      await Promise.all(
        batch.map((item) => {
          return new Promise<void>((resolve) => {
            const formData = new FormData();
            formData.append('images', item.file);
            if (tagToUse) {
              formData.append('tag', tagToUse);
            }
            formData.append('source', 'web_upload');

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload', true);

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                setQueue((prev) =>
                  prev.map((q) => (q.id === item.id ? { ...q, progress: percent, status: 'uploading' } : q))
                );
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setQueue((prev) =>
                  prev.map((q) => (q.id === item.id ? { ...q, progress: 100, status: 'completed' } : q))
                );
              } else {
                setQueue((prev) =>
                  prev.map((q) =>
                    q.id === item.id
                      ? { ...q, status: 'error', errorMessage: xhr.responseText || 'Upload failed' }
                      : q
                  )
                );
              }
              resolve();
            };

            xhr.onerror = () => {
              setQueue((prev) =>
                prev.map((q) =>
                  q.id === item.id ? { ...q, status: 'error', errorMessage: 'Network error' } : q
                )
              );
              resolve();
            };

            xhr.send(formData);
          });
        })
      );
    }

    setIsUploading(false);
    onUploadSuccess();
  };

  if (!isOpen) return null;

  const totalBytes = queue.reduce((acc, i) => acc + i.size, 0);
  const pendingCount = queue.filter((i) => i.status === 'pending').length;
  const completedCount = queue.filter((i) => i.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#10121a] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Bulk Image Dump</span>
              <span className="text-xs font-mono text-amber-400 font-normal border border-amber-400/30 px-1.5 py-0.5 rounded">
                Lossless 0% Compression
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Files are stored byte-for-byte intact. Paste anywhere or drag and drop.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Box Area */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-400/10 scale-[0.99]'
                : 'border-zinc-700/80 hover:border-zinc-500 bg-zinc-900/40 hover:bg-zinc-900/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = '';
              }}
              multiple
              accept="image/*"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-amber-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-200">
                  Drop pictures here or <span className="text-amber-400 underline">browse files</span>
                </p>
                <p className="text-xs text-zinc-400 font-mono">
                  PNG · JPEG · WEBP · GIF · AVIF · SVG · RAW up to 200MB / file
                </p>
              </div>
              <div className="text-[11px] text-zinc-400 bg-zinc-800/60 px-2.5 py-1 rounded-full border border-zinc-700/40">
                Tip: Press <kbd className="font-mono text-zinc-300">Ctrl+V</kbd> to dump copied screenshots instantly
              </div>
            </div>
          </div>

          {/* Optional Tagging */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              <TagIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Optional Category Tag</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {existingTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTag(selectedTag === tag ? '' : tag);
                    setCustomTag('');
                  }}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                    selectedTag === tag
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-medium'
                      : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
              <input
                type="text"
                placeholder="Or new tag..."
                value={customTag}
                onChange={(e) => {
                  setCustomTag(e.target.value);
                  setSelectedTag('');
                }}
                className="px-2.5 py-1 text-xs bg-zinc-800/80 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 w-32"
              />
            </div>
          </div>

          {/* Queue List */}
          {queue.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
                <span>
                  {queue.length} files selected ({formatBytes(totalBytes)})
                </span>
                <button
                  onClick={clearQueue}
                  disabled={isUploading}
                  className="text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  Clear all
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt=""
                          className="w-8 h-8 rounded object-cover border border-zinc-700 shrink-0"
                        />
                      ) : (
                        <FileImage className="w-8 h-8 text-zinc-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-200 truncate">{item.name}</p>
                        <p className="text-[11px] font-mono text-zinc-500">{formatBytes(item.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {item.status === 'uploading' && (
                        <div className="w-20 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-amber-400 h-full transition-all duration-150"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.status === 'completed' && (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          <span>Done</span>
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="flex items-center gap-1 text-red-400 font-medium" title={item.errorMessage}>
                          <AlertCircle className="w-4 h-4" />
                          <span>Failed</span>
                        </span>
                      )}
                      {item.status === 'pending' && !isUploading && (
                        <button
                          onClick={() => removeQueueItem(item.id)}
                          className="text-zinc-500 hover:text-zinc-200 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/50">
          <div className="text-xs text-zinc-400">
            {completedCount > 0 && (
              <span className="text-emerald-400 font-medium">{completedCount} uploaded successfully</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={startUpload}
              disabled={isUploading || pendingCount === 0}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-amber-400/20 transition-all"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Dumping ({pendingCount} left)...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload {pendingCount > 0 ? `(${pendingCount})` : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
