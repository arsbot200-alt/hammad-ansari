import React, { useState } from 'react';
import {
  Search,
  MoreVertical,
  Plus,
  Trash2,
  Settings,
  Code2,
  Check,
  Lock,
} from 'lucide-react';
import { SubTab } from '../types';

interface GalleryHeaderProps {
  activeSubTab: SubTab;
  onSelectSubTab: (tab: SubTab) => void;
  onOpenSearch: () => void;
  onOpenUpload: () => void;
  onOpenTrash: () => void;
  onOpenSettings: () => void;
  onOpenVercelModal: () => void;
  onLockApp?: () => void;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  activeSubTab,
  onSelectSubTab,
  onOpenSearch,
  onOpenUpload,
  onOpenTrash,
  onOpenSettings,
  onOpenVercelModal,
  onLockApp,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#090b10]/95 backdrop-blur-md border-b border-zinc-850 px-4 pt-3 pb-1 select-none max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto w-full">
      {/* Top row matching Screen 2: "Gallery", Search, MoreVertical */}
      <div className="flex items-center justify-between py-1 relative">
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
          Gallery
        </h1>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Search photos"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Menu"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* 3-dots Menu dropdown */}
        {showMenu && (
          <div
            className="absolute right-0 top-12 w-48 bg-[#171b26] border border-zinc-800 rounded-2xl p-1.5 shadow-2xl z-50 text-xs space-y-1 animate-in slide-in-from-top-2 duration-150"
            onClick={() => setShowMenu(false)}
          >
            <button
              onClick={onOpenUpload}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-blue-400 hover:bg-blue-950/40 font-semibold text-left"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Photos</span>
            </button>
            <button
              onClick={onOpenTrash}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:bg-zinc-800 text-left"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Trash Bin</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:bg-zinc-800 text-left"
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              <span>Settings</span>
            </button>
            <button
              onClick={onOpenVercelModal}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:bg-zinc-800 text-left"
            >
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>Vercel & API</span>
            </button>
            {onLockApp && (
              <button
                onClick={onLockApp}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 text-left border-t border-zinc-800/60 mt-1 pt-2 font-medium"
              >
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Lock Gallery</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub Tabs Row matching Mockup Screen 2: Photos, Albums, Explore */}
      <div className="flex items-center gap-6 mt-1 border-b border-transparent">
        <button
          onClick={() => onSelectSubTab('photos')}
          className={`py-2 text-sm font-semibold relative transition-colors ${
            activeSubTab === 'photos'
              ? 'text-blue-500'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Photos
          {activeSubTab === 'photos' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => onSelectSubTab('albums')}
          className={`py-2 text-sm font-semibold relative transition-colors ${
            activeSubTab === 'albums'
              ? 'text-blue-500'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Albums
          {activeSubTab === 'albums' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => onSelectSubTab('explore')}
          className={`py-2 text-sm font-semibold relative transition-colors ${
            activeSubTab === 'explore'
              ? 'text-blue-500'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Explore
          {activeSubTab === 'explore' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
};
