import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Folder,
  Heart,
  MoreHorizontal,
  Trash2,
  Settings,
  Code2,
  Plus,
} from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenUpload: () => void;
  trashCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenUpload,
  trashCount,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <>
      {/* "More" Popover Menu when clicking More icon */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="absolute bottom-20 right-4 w-52 bg-[#171b26] border border-zinc-800 rounded-2xl p-2 shadow-2xl space-y-1 animate-in slide-in-from-bottom-3 duration-150 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onSelectTab('trash');
                setShowMoreMenu(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 text-zinc-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Trash Bin</span>
              </div>
              {trashCount > 0 && (
                <span className="font-mono text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                  {trashCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onSelectTab('settings');
                setShowMoreMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 text-zinc-300 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              <span>Settings & Storage</span>
            </button>

            <button
              onClick={() => {
                onOpenUpload();
                setShowMoreMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Photos</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Bar matching Mockup Screens 2 & 3 */}
      <nav className="fixed bottom-0 inset-x-0 z-30 h-16 bg-[#0e121c]/95 border-t border-zinc-800/80 backdrop-blur-md flex items-center justify-around px-2 text-zinc-400 max-w-lg md:max-w-2xl lg:max-w-5xl mx-auto rounded-t-2xl sm:rounded-t-none">
        <button
          onClick={() => onSelectTab('photos')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition-colors ${
            currentTab === 'photos'
              ? 'text-blue-500 font-semibold'
              : 'hover:text-zinc-200'
          }`}
        >
          <ImageIcon className="w-5 h-5" />
          <span className="text-[11px]">Photos</span>
        </button>

        <button
          onClick={() => onSelectTab('albums')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition-colors ${
            currentTab === 'albums'
              ? 'text-blue-500 font-semibold'
              : 'hover:text-zinc-200'
          }`}
        >
          <Folder className="w-5 h-5" />
          <span className="text-[11px]">Albums</span>
        </button>

        <button
          onClick={() => onSelectTab('favorites')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition-colors ${
            currentTab === 'favorites'
              ? 'text-blue-500 font-semibold'
              : 'hover:text-zinc-200'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span className="text-[11px]">Favorites</span>
        </button>

        <button
          onClick={() => setShowMoreMenu((prev) => !prev)}
          className={`relative flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition-colors ${
            currentTab === 'trash' || currentTab === 'settings'
              ? 'text-blue-500 font-semibold'
              : 'hover:text-zinc-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[11px]">More</span>
          {trashCount > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
      </nav>
    </>
  );
};
