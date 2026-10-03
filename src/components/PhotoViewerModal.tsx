import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Heart,
  MoreVertical,
  Share2,
  Edit2,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  Check,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Hand,
} from 'lucide-react';
import { ImageRecord } from '../types';
import { formatBytes, formatDate, copyToClipboard, triggerDownload, getSafeImageUrl } from '../utils/format';

interface PhotoViewerModalProps {
  images: ImageRecord[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onToggleFavorite: (id: string) => void;
  onMoveToTrash: (id: string) => void;
  onOpenEditor: (image: ImageRecord) => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onToggleFavorite,
  onMoveToTrash,
  onOpenEditor,
}) => {
  const currentImage = images[currentIndex];
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Swipe & Touch Gestures
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeHint, setSwipeHint] = useState<string | null>(null);

  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const lastTapRef = useRef<number>(0);
  const activeDirectionRef = useRef<'none' | 'horizontal' | 'vertical'>('none');

  // Reset state on photo switch
  useEffect(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setShowMoreSheet(false);
  }, [currentIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (zoomLevel > 1) {
          setZoomLevel(1);
          setPanOffset({ x: 0, y: 0 });
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        onNavigate((currentIndex + 1) % images.length);
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        onNavigate((currentIndex - 1 + images.length) % images.length);
      } else if (e.key === 'e' || e.key === 'E') {
        if (currentImage) onOpenEditor(currentImage);
      } else if (e.key === 'd' || e.key === 'D') {
        if (currentImage) triggerDownload(currentImage.downloadUrl, currentImage.originalName);
      }
    },
    [isOpen, images.length, currentIndex, onNavigate, onClose, currentImage, onOpenEditor, zoomLevel]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleShare = async () => {
    if (!currentImage) return;
    const ok = await copyToClipboard(currentImage.rawUrl);
    if (ok) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // --- SWIPE GESTURE HANDLERS ---
  const handleStart = (clientX: number, clientY: number) => {
    touchStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    activeDirectionRef.current = 'none';
    setIsDragging(true);
    setIsAnimating(false);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - touchStartRef.current.x;
    const deltaY = clientY - touchStartRef.current.y;

    // If zoomed in, handle image panning
    if (zoomLevel > 1) {
      setPanOffset((prev) => ({
        x: prev.x + deltaX * 0.4,
        y: prev.y + deltaY * 0.4,
      }));
      touchStartRef.current = { x: clientX, y: clientY, time: touchStartRef.current.time };
      return;
    }

    // Determine gesture direction lock
    if (activeDirectionRef.current === 'none') {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX > 8 || absY > 8) {
        if (absX > absY) {
          activeDirectionRef.current = 'horizontal';
        } else if (deltaY > 5) {
          activeDirectionRef.current = 'vertical';
        }
      }
    }

    if (activeDirectionRef.current === 'horizontal') {
      // Fluid horizontal drag with smooth resistance
      setDragOffset({ x: deltaX * 0.85, y: 0 });
      if (deltaX < -30) {
        setSwipeHint('Next →');
      } else if (deltaX > 30) {
        setSwipeHint('← Previous');
      } else {
        setSwipeHint(null);
      }
    } else if (activeDirectionRef.current === 'vertical') {
      // Pull down to dismiss
      setDragOffset({ x: 0, y: Math.max(0, deltaY) });
      if (deltaY > 50) {
        setSwipeHint('Release to close');
      } else {
        setSwipeHint(null);
      }
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsAnimating(true);
    setSwipeHint(null);

    const deltaX = dragOffset.x;
    const deltaY = dragOffset.y;
    const duration = Date.now() - touchStartRef.current.time;
    const velocityX = Math.abs(deltaX) / (duration || 1);

    if (activeDirectionRef.current === 'horizontal' && images.length > 1) {
      // Swiped Left -> NEXT
      if (deltaX < -45 || (deltaX < -20 && velocityX > 0.35)) {
        setDragOffset({ x: -window.innerWidth, y: 0 });
        setTimeout(() => {
          onNavigate((currentIndex + 1) % images.length);
          setDragOffset({ x: 0, y: 0 });
          setIsAnimating(false);
        }, 160);
        return;
      }
      // Swiped Right -> PREVIOUS
      else if (deltaX > 45 || (deltaX > 20 && velocityX > 0.35)) {
        setDragOffset({ x: window.innerWidth, y: 0 });
        setTimeout(() => {
          onNavigate((currentIndex - 1 + images.length) % images.length);
          setDragOffset({ x: 0, y: 0 });
          setIsAnimating(false);
        }, 160);
        return;
      }
    } else if (activeDirectionRef.current === 'vertical') {
      // Pulled down -> DISMISS
      if (deltaY > 90) {
        setDragOffset({ x: 0, y: window.innerHeight });
        setTimeout(() => {
          onClose();
        }, 150);
        return;
      }
    }

    // Snap back
    setDragOffset({ x: 0, y: 0 });
    setTimeout(() => setIsAnimating(false), 200);
  };

  // Double tap to zoom
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected!
      setZoomLevel((prev) => (prev === 1 ? 2.5 : 1));
      setPanOffset({ x: 0, y: 0 });
      setDragOffset({ x: 0, y: 0 });
    }
    lastTapRef.current = now;
  };

  if (!isOpen || !currentImage) return null;

  // Dynamic backdrop opacity during pull-down-to-dismiss
  const backdropOpacity = Math.max(0.2, 1 - Math.abs(dragOffset.y) / 400);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#080a0f] text-white select-none transition-colors duration-150"
      style={{ backgroundColor: `rgba(8, 10, 15, ${backdropOpacity})` }}
    >
      {/* Top Header matching Mockup Screen 4: ArrowLeft, 1/245, Heart, MoreVertical */}
      <div className="h-16 px-4 flex items-center justify-between z-40 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Back (Esc)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium tracking-wide font-sans text-zinc-200">
            {currentIndex + 1}/{images.length}
          </span>
        </div>

        {/* Swipe Hint Pill */}
        {swipeHint && (
          <div className="px-3 py-1 rounded-full bg-blue-600/90 text-white text-xs font-mono font-semibold animate-pulse shadow-lg">
            {swipeHint}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(currentImage.id)}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Favorite"
          >
            <Heart
              className={`w-5 h-5 ${
                currentImage.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-300'
              }`}
            />
          </button>

          <button
            onClick={() => setShowMoreSheet((prev) => !prev)}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="More Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Fullscreen Distortion-Free Image Display with Touch & Mouse Swipe */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-4 touch-none cursor-grab active:cursor-grabbing"
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            handleDoubleTap(e);
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 1) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => {
          handleDoubleTap(e);
          handleStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            handleMove(e.clientX, e.clientY);
          }
        }}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        {/* Navigation arrows for desktop clickers */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate((currentIndex - 1 + images.length) % images.length);
              }}
              className="hidden sm:flex absolute left-4 z-30 p-3 rounded-full bg-black/50 hover:bg-zinc-800/80 text-white backdrop-blur-xs transition-transform active:scale-95"
              title="Previous Photo (Swipe Right)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate((currentIndex + 1) % images.length);
              }}
              className="hidden sm:flex absolute right-4 z-30 p-3 rounded-full bg-black/50 hover:bg-zinc-800/80 text-white backdrop-blur-xs transition-transform active:scale-95"
              title="Next Photo (Swipe Left)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Crisp Distortion-Free Image with live swipe drag transformation */}
        <div
          className="w-full h-full flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate3d(${dragOffset.x + panOffset.x}px, ${dragOffset.y + panOffset.y}px, 0) scale(${
              zoomLevel * (1 - Math.min(0.4, Math.abs(dragOffset.y) / 1000))
            }) rotate(${currentImage.rotation || 0}deg)`,
            transition: isAnimating ? 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
          }}
        >
          <img
            src={getSafeImageUrl(currentImage)}
            alt={currentImage.originalName}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            className="max-w-full max-h-full object-contain pointer-events-none"
            style={{
              filter: currentImage.filterApplied || undefined,
            }}
            draggable={false}
            onError={(e) => {
              const target = e.currentTarget;
              const fallback = `/api/raw/${currentImage.id}`;
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
          />
        </div>

        {/* More Details & EXIF Bottom Sheet */}
        {showDetails && (
          <div
            className="absolute inset-0 bg-black/70 z-40 flex items-end sm:items-center justify-center pointer-events-auto"
            onClick={() => setShowDetails(false)}
          >
            <div
              className="w-full max-w-md bg-[#131722] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-bold text-white text-base">Photo Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-zinc-400 hover:text-white text-xs px-2 py-1"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-500">File Name</span>
                  <span className="font-mono text-zinc-300 truncate max-w-[200px]">
                    {currentImage.originalName}
                  </span>
                </div>
                {currentImage.width && currentImage.height && (
                  <div className="flex justify-between py-1 border-b border-zinc-800/50">
                    <span className="text-zinc-500">Dimensions</span>
                    <span className="font-mono text-zinc-300">
                      {currentImage.width} × {currentImage.height} px
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-500">File Size</span>
                  <span className="font-mono text-blue-400 font-semibold">
                    {formatBytes(currentImage.sizeBytes)} ({currentImage.sizeBytes.toLocaleString()} bytes)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-500">MIME Type</span>
                  <span className="font-mono text-zinc-300">{currentImage.mimeType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-500">Date Uploaded</span>
                  <span className="font-mono text-zinc-300">{formatDate(currentImage.uploadedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* More Options Popover */}
        {showMoreSheet && (
          <div
            className="absolute top-16 right-4 w-52 bg-[#171b26] border border-zinc-800 rounded-2xl p-2 shadow-2xl space-y-1 z-50 text-xs pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                triggerDownload(currentImage.downloadUrl, currentImage.originalName);
                setShowMoreSheet(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800 text-zinc-200"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Download Original</span>
            </button>

            <button
              onClick={() => {
                setShowDetails(true);
                setShowMoreSheet(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800 text-zinc-200"
            >
              <Info className="w-4 h-4 text-amber-400" />
              <span>File Details & EXIF</span>
            </button>

            <button
              onClick={() => {
                setZoomLevel((z) => (z === 1 ? 2.5 : 1));
                setPanOffset({ x: 0, y: 0 });
                setShowMoreSheet(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800 text-zinc-200"
            >
              <ZoomIn className="w-4 h-4 text-emerald-400" />
              <span>{zoomLevel === 1 ? 'Zoom 250%' : 'Reset Zoom'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Share Toast */}
      {copiedUrl && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Raw URL copied to clipboard!</span>
        </div>
      )}

      {/* Bottom Action Bar matching Mockup Screen 4: Share, Edit, Delete, More */}
      <div className="h-20 px-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-around z-40 text-zinc-300 max-w-md mx-auto w-full">
        {/* Share */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center justify-center gap-1.5 p-2 hover:text-white transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[11px] font-medium">Share</span>
        </button>

        {/* Edit */}
        <button
          onClick={() => onOpenEditor(currentImage)}
          className="flex flex-col items-center justify-center gap-1.5 p-2 hover:text-blue-400 transition-colors"
        >
          <Edit2 className="w-5 h-5" />
          <span className="text-[11px] font-medium">Edit</span>
        </button>

        {/* Delete (Move to Trash) */}
        <button
          onClick={() => {
            onMoveToTrash(currentImage.id);
            onClose();
          }}
          className="flex flex-col items-center justify-center gap-1.5 p-2 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-[11px] font-medium">Delete</span>
        </button>

        {/* More */}
        <button
          onClick={() => setShowMoreSheet((prev) => !prev)}
          className="flex flex-col items-center justify-center gap-1.5 p-2 hover:text-white transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[11px] font-medium">More</span>
        </button>
      </div>
    </div>
  );
};
