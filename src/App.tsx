/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ImageRecord, StorageStats, NavTab, SubTab } from './types';
import { GalleryHeader } from './components/GalleryHeader';
import { MainPhotosGrid } from './components/MainPhotosGrid';
import { AlbumsView } from './components/AlbumsView';
import { ExploreView } from './components/ExploreView';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { PhotoEditorModal } from './components/PhotoEditorModal';
import { SearchView } from './components/SearchView';
import { TrashView } from './components/TrashView';
import { SettingsView } from './components/SettingsView';
import { BottomNavBar } from './components/BottomNavBar';
import { DropZone } from './components/DropZone';
import { VercelDeployModal } from './components/VercelDeployModal';
import { LockScreen, AUTH_STORAGE_KEY } from './components/LockScreen';
import { Upload } from 'lucide-react';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [images, setImages] = useState<ImageRecord[]>([]);
  const [trashedImages, setTrashedImages] = useState<ImageRecord[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('photos');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('photos');
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState<string>('All Photos');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest'>('newest');

  // Search & Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingPhotoIndex, setViewingPhotoIndex] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<ImageRecord | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isVercelModalOpen, setIsVercelModalOpen] = useState(false);

  // Drag over window overlay
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Fetch active photos
  const fetchImages = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedAlbumFilter && selectedAlbumFilter !== 'All Photos') {
        params.append('album', selectedAlbumFilter);
      }
      if (sortOption) params.append('sort', sortOption);
      params.append('limit', '300');

      const res = await fetch(`/api/images?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load photos:', err);
    }
  }, [selectedAlbumFilter, sortOption]);

  // Fetch trashed photos
  const fetchTrashed = useCallback(async () => {
    try {
      const res = await fetch('/api/images?trash=true');
      if (res.ok) {
        const data = await res.json();
        setTrashedImages(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load trash:', err);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchImages(), fetchTrashed(), fetchStats()]);
  }, [fetchImages, fetchTrashed, fetchStats]);

  // Initial load
  useEffect(() => {
    Promise.all([fetchImages(), fetchTrashed(), fetchStats()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchImages, fetchTrashed, fetchStats]);

  // Real-time background sync every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchImages();
        fetchTrashed();
        fetchStats();
      }
    }, 3500);

    const onFocus = () => {
      if (document.visibilityState === 'visible') refreshAll();
    };

    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchImages, fetchTrashed, fetchStats, refreshAll]);

  // Global Paste listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const files = Array.from(e.clipboardData.files).filter(
          (f) => f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(f.name)
        );
        if (files.length > 0) {
          e.preventDefault();
          setIsUploadOpen(true);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Global Drag & Drop listener
  const handleWindowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleWindowDragLeave = (e: React.DragEvent) => {
    if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
      setIsDraggingOver(false);
    }
  };

  const handleWindowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsUploadOpen(true);
    }
  };

  // Actions
  const handleToggleFavorite = async (id: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, isFavorite: !img.isFavorite } : img))
    );
    try {
      await fetch(`/api/images/${id}/favorite`, { method: 'POST' });
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToTrash = async (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    try {
      await fetch(`/api/images/${id}/trash`, { method: 'POST' });
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreFromTrash = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => fetch(`/api/images/${id}/restore`, { method: 'POST' })));
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => fetch(`/api/images/${id}`, { method: 'DELETE' })));
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await fetch('/api/images/empty-trash', { method: 'POST' });
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdits = async (id: string, filterCss: string, rotation: number) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, filterApplied: filterCss, rotation } : img
      )
    );
    try {
      await fetch(`/api/images/${id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filterApplied: filterCss, rotation }),
      });
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered images for search
  const searchResults = images.filter((img) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      img.originalName.toLowerCase().includes(q) ||
      (img.tag && img.tag.toLowerCase().includes(q)) ||
      (img.album && img.album.toLowerCase().includes(q))
    );
  });

  const displayedImages =
    currentTab === 'favorites'
      ? images.filter((i) => i.isFavorite)
      : images;

  const handleLockApp = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    setIsUnlocked(false);
  };

  if (!isUnlocked) {
    return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
        isDarkMode ? 'bg-[#090b10] text-zinc-100' : 'bg-[#f4f5f7] text-zinc-900'
      }`}
      onDragOver={handleWindowDragOver}
      onDragLeave={handleWindowDragLeave}
      onDrop={handleWindowDrop}
    >
      {/* Fullscreen Drag Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-8 border-4 border-dashed border-blue-500 m-4 rounded-3xl pointer-events-none animate-in fade-in duration-150">
          <Upload className="w-16 h-16 text-blue-500 animate-bounce mb-4" />
          <h2 className="text-2xl font-black text-white">Drop Photos to Gallery</h2>
          <p className="text-sm font-mono text-blue-300 mt-2">
            Original full quality · Zero distortion · Instant dump
          </p>
        </div>
      )}

      {/* Main View Switcher */}
      {isSearchOpen ? (
        <SearchView
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClose={() => setIsSearchOpen(false)}
          results={searchResults}
          onSelectPhoto={(idx) => {
            setViewingPhotoIndex(idx);
          }}
          onSelectAlbum={(alb) => {
            setSelectedAlbumFilter(alb);
            setIsSearchOpen(false);
            setCurrentTab('photos');
            setActiveSubTab('photos');
          }}
        />
      ) : currentTab === 'trash' ? (
        <TrashView
          trashedImages={trashedImages}
          onBack={() => setCurrentTab('photos')}
          onRestore={handleRestoreFromTrash}
          onPermanentDelete={handlePermanentDelete}
          onEmptyTrash={handleEmptyTrash}
        />
      ) : currentTab === 'settings' ? (
        <SettingsView
          onBack={() => setCurrentTab('photos')}
          stats={stats}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onOpenVercelModal={() => setIsVercelModalOpen(true)}
          sortOption={sortOption}
          onChangeSortOption={setSortOption}
          onLockApp={handleLockApp}
        />
      ) : (
        <>
          {/* Gallery Header matching Mockup Screen 2 */}
          <GalleryHeader
            activeSubTab={activeSubTab}
            onSelectSubTab={(tab) => {
              setActiveSubTab(tab);
              if (tab === 'albums') {
                setCurrentTab('albums');
              } else if (tab === 'photos') {
                setCurrentTab('photos');
                setSelectedAlbumFilter('All Photos');
              }
            }}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenTrash={() => setCurrentTab('trash')}
            onOpenSettings={() => setCurrentTab('settings')}
            onOpenVercelModal={() => setIsVercelModalOpen(true)}
            onLockApp={handleLockApp}
          />

          {/* Active Album Filter banner if selected */}
          {selectedAlbumFilter !== 'All Photos' && (
            <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto w-full px-4 pt-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-xs">
                <span className="text-blue-400 font-semibold">
                  Viewing Album: <strong>{selectedAlbumFilter}</strong>
                </span>
                <button
                  onClick={() => setSelectedAlbumFilter('All Photos')}
                  className="text-zinc-400 hover:text-white underline font-mono text-[11px]"
                >
                  Show All Photos
                </button>
              </div>
            </div>
          )}

          {/* Content Pane */}
          <main className="flex-1 pt-2">
            {isLoading ? (
              <div className="py-32 flex flex-col items-center justify-center gap-3 text-zinc-500">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-mono">Loading gallery...</p>
              </div>
            ) : currentTab === 'albums' || activeSubTab === 'albums' ? (
              <AlbumsView
                images={images}
                onSelectAlbum={(name) => {
                  setSelectedAlbumFilter(name);
                  setActiveSubTab('photos');
                  setCurrentTab('photos');
                }}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            ) : activeSubTab === 'explore' ? (
              <ExploreView
                images={images}
                onSelectTag={(tag) => {
                  setSelectedAlbumFilter(tag);
                  setActiveSubTab('photos');
                  setCurrentTab('photos');
                }}
                isDarkMode={isDarkMode}
              />
            ) : (
              <MainPhotosGrid
                images={displayedImages}
                onOpenPhoto={(idx) => setViewingPhotoIndex(idx)}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}
          </main>

          {/* Bottom Navigation Bar matching Mockup Screens 2 & 3 */}
          <BottomNavBar
            currentTab={currentTab}
            onSelectTab={(tab) => {
              setCurrentTab(tab);
              if (tab === 'photos') {
                setActiveSubTab('photos');
                setSelectedAlbumFilter('All Photos');
              } else if (tab === 'albums') {
                setActiveSubTab('albums');
              }
            }}
            onOpenUpload={() => setIsUploadOpen(true)}
            trashCount={trashedImages.length}
          />
        </>
      )}

      {/* Screen 4: Photo Viewer Fullscreen Modal */}
      {viewingPhotoIndex !== null && (
        <PhotoViewerModal
          images={displayedImages}
          currentIndex={viewingPhotoIndex}
          isOpen={viewingPhotoIndex !== null}
          onClose={() => setViewingPhotoIndex(null)}
          onNavigate={(idx) => setViewingPhotoIndex(idx)}
          onToggleFavorite={handleToggleFavorite}
          onMoveToTrash={handleMoveToTrash}
          onOpenEditor={(img) => setEditingImage(img)}
        />
      )}

      {/* Screen 5: Photo Editor Modal */}
      {editingImage !== null && (
        <PhotoEditorModal
          image={editingImage}
          isOpen={editingImage !== null}
          onClose={() => setEditingImage(null)}
          onSaveEdits={handleSaveEdits}
        />
      )}

      {/* Upload Dropzone */}
      <DropZone
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={refreshAll}
        existingTags={stats?.tags || []}
      />

      {/* Vercel Deployment & API Modal */}
      <VercelDeployModal
        isOpen={isVercelModalOpen}
        onClose={() => setIsVercelModalOpen(false)}
        onUploadSuccess={refreshAll}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
