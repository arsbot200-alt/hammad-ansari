import React from 'react';
import {
  ChevronRight,
  Plus,
  MoreVertical,
  Image as ImageIcon,
  Heart,
  Folder,
} from 'lucide-react';
import { ImageRecord } from '../types';
import { getSafeImageUrl } from '../utils/format';

interface AlbumsViewProps {
  images: ImageRecord[];
  onSelectAlbum: (albumName: string) => void;
  onOpenUpload: () => void;
}

export const AlbumsView: React.FC<AlbumsViewProps> = ({
  images,
  onSelectAlbum,
  onOpenUpload,
}) => {
  const allCount = images.length;
  const favCount = images.filter((i) => i.isFavorite).length;

  // Group actual albums by real photos only (no fake hardcoded categories!)
  const albumMap = new Map<string, ImageRecord[]>();
  images.forEach((img) => {
    const alb = img.album || img.tag || 'Camera';
    if (!albumMap.has(alb)) {
      albumMap.set(alb, []);
    }
    albumMap.get(alb)!.push(img);
  });

  const realAlbums: {
    name: string;
    count: number;
    cover?: string;
    icon: React.ReactNode;
  }[] = [
    {
      name: 'All Photos',
      count: allCount,
      cover: images[0] ? getSafeImageUrl(images[0]) : undefined,
      icon: <ImageIcon className="w-5 h-5 text-blue-400" />,
    },
  ];

  if (favCount > 0) {
    const favImg = images.find((i) => i.isFavorite);
    realAlbums.push({
      name: 'Favorites',
      count: favCount,
      cover: favImg ? getSafeImageUrl(favImg) : undefined,
      icon: <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />,
    });
  }

  // Add user's real albums
  albumMap.forEach((imgs, albName) => {
    if (albName !== 'All Photos' && albName !== 'Favorites') {
      realAlbums.push({
        name: albName,
        count: imgs.length,
        cover: imgs[0] ? getSafeImageUrl(imgs[0]) : undefined,
        icon: <Folder className="w-5 h-5 text-amber-400" />,
      });
    }
  });

  return (
    <div className="space-y-4 pb-20 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 select-none">
      {/* Header matching Mockup Screen 3 */}
      <div className="flex items-center justify-between pt-2 pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
          Albums
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenUpload}
            className="p-2 rounded-full hover:bg-zinc-800 text-blue-400 hover:text-blue-300 transition-colors"
            title="Upload photos"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Real Album Rows List */}
      <div className="space-y-2">
        {realAlbums.map((album) => (
          <div
            key={album.name}
            onClick={() => onSelectAlbum(album.name)}
            className="flex items-center justify-between p-3 rounded-2xl bg-[#121622] hover:bg-zinc-800/60 active:bg-zinc-800/80 cursor-pointer transition-colors group border border-zinc-850"
          >
            {/* Left Cover Avatar + Title + Count */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                {album.cover ? (
                  <img
                    src={album.cover}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  album.icon
                )}
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                  {album.name}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {album.count} {album.count === 1 ? 'photo' : 'photos'}
                </p>
              </div>
            </div>

            {/* Right Chevron */}
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
