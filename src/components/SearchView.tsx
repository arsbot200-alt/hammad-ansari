import React from 'react';
import {
  ArrowLeft,
  Search,
  X,
  FileImage,
} from 'lucide-react';
import { ImageRecord } from '../types';
import { getSafeImageUrl } from '../utils/format';

interface SearchViewProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onClose: () => void;
  results: ImageRecord[];
  onSelectPhoto: (index: number) => void;
  onSelectAlbum: (album: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  onSearchChange,
  onClose,
  results,
  onSelectPhoto,
  onSelectAlbum,
}) => {
  const albums = Array.from(new Set(results.map((i) => i.album || i.tag || 'Camera')));

  return (
    <div className="space-y-6 pb-24 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4">
      {/* Search Header matching Mockup Screen 6: ArrowLeft, search input, clear button */}
      <div className="flex items-center gap-3 pt-3">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 relative flex items-center bg-[#151924] rounded-full border border-zinc-800 px-3.5 py-2">
          <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search photos, tags, albums..."
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Photos Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-bold text-white text-sm">Photos</h3>
          <span className="font-mono text-zinc-400">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {results.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            No matching photos found
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {results.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => onSelectPhoto(idx)}
                className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-850 cursor-pointer group select-none"
              >
                <img
                  src={getSafeImageUrl(img)}
                  alt={img.originalName}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = `/api/raw/${img.id}`;
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Albums Section matching Mockup Screen 6 */}
      {albums.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-white text-sm">Albums</h3>
            <span className="text-blue-400 font-semibold cursor-pointer">View all</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {albums.map((albumName) => {
              const albumImgs = results.filter((i) => (i.album || i.tag || 'Camera') === albumName);
              const cover = albumImgs[0]?.rawUrl;

              return (
                <div
                  key={albumName}
                  onClick={() => onSelectAlbum(albumName)}
                  className="rounded-2xl overflow-hidden bg-[#151924] border border-zinc-800 cursor-pointer group transition-all hover:border-zinc-700"
                >
                  <div className="aspect-[4/3] bg-zinc-950 overflow-hidden">
                    {cover ? (
                      <img
                        src={cover}
                        alt={albumName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <FileImage className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-xs font-semibold text-white truncate">{albumName}</h4>
                    <p className="text-[10px] text-zinc-400 font-mono">{albumImgs.length}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
