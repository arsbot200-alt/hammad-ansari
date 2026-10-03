import React from 'react';
import { ImageRecord } from '../types';
import { groupImagesByDate } from '../utils/dateGrouping';
import { getSafeImageUrl } from '../utils/format';
import { Upload } from 'lucide-react';

interface MainPhotosGridProps {
  images: ImageRecord[];
  onOpenPhoto: (index: number) => void;
  onOpenUpload: () => void;
}

export const MainPhotosGrid: React.FC<MainPhotosGridProps> = ({
  images,
  onOpenPhoto,
  onOpenUpload,
}) => {
  if (images.length === 0) {
    return (
      <div className="py-24 text-center max-w-sm mx-auto px-4">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">
          No photos yet
        </h3>
        <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
          Drop photos in original quality with zero distortion or compression.
        </p>
        <button
          onClick={onOpenUpload}
          className="px-5 py-2.5 text-xs font-semibold rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all hover:scale-105"
        >
          Upload Photos
        </button>
      </div>
    );
  }

  const groups = groupImagesByDate(images);

  return (
    <div className="space-y-6 pb-24 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 select-none">
      {groups.map((group) => (
        <section key={group.dateKey} className="space-y-2">
          {/* Date Header matching Mockup Screen 2: "Today", "Yesterday" */}
          <div className="py-1">
            <h2 className="text-sm font-bold tracking-tight text-white font-sans">
              {group.relativeTime || group.displayDate}
            </h2>
          </div>

          {/* Clean 3-Column Square Grid matching Mockup Screen 2 (zero distortion) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {group.images.map((img) => {
              const globalIndex = images.findIndex((i) => i.id === img.id);
              const imageUrl = getSafeImageUrl(img);

              return (
                <div
                  key={img.id}
                  onClick={() => onOpenPhoto(globalIndex)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 cursor-pointer group active:scale-[0.98] transition-transform"
                >
                  <img
                    src={imageUrl}
                    alt={img.originalName}
                    loading="lazy"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    style={{
                      transform: img.rotation ? `rotate(${img.rotation}deg)` : undefined,
                      filter: img.filterApplied || undefined,
                    }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = `/api/raw/${img.id}`;
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                  {img.isFavorite && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
