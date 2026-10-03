import React from 'react';
import { Tag, Folder, Sparkles, Image as ImageIcon } from 'lucide-react';
import { ImageRecord } from '../types';
import { formatBytes } from '../utils/format';

interface ExploreViewProps {
  images: ImageRecord[];
  onSelectTag: (tag: string) => void;
  isDarkMode: boolean;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  images,
  onSelectTag,
  isDarkMode,
}) => {
  // Group images by tag
  const tagMap = new Map<string, ImageRecord[]>();
  images.forEach((img) => {
    const t = img.tag || 'Untagged';
    if (!tagMap.has(t)) {
      tagMap.set(t, []);
    }
    tagMap.get(t)!.push(img);
  });

  const categories = Array.from(tagMap.entries());

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Albums & Categories
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Explore your dumped photos categorized by theme and sensor types.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(([tagName, list]) => {
          const coverImage = list[0];
          const totalBytes = list.reduce((acc, i) => acc + i.sizeBytes, 0);

          return (
            <div
              key={tagName}
              onClick={() => onSelectTag(tagName)}
              className={`group rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-sm ${
                isDarkMode
                  ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:shadow-lg'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md'
              }`}
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-zinc-950">
                {coverImage ? (
                  <img
                    src={coverImage.rawUrl}
                    alt={tagName}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-bold text-sm tracking-tight drop-shadow-sm">{tagName}</h3>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-300">
                    <span>{list.length} {list.length === 1 ? 'item' : 'items'}</span>
                    <span>·</span>
                    <span>{formatBytes(totalBytes)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
