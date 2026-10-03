import React, { useState } from 'react';
import {
  ArrowLeft,
  Crop,
  RotateCw,
  Sun,
  Contrast,
  Droplets,
  Check,
} from 'lucide-react';
import { ImageRecord, FilterPreset } from '../types';
import { getSafeImageUrl } from '../utils/format';

interface PhotoEditorModalProps {
  image: ImageRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveEdits: (id: string, filterCss: string, rotation: number) => Promise<void>;
}

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({
  image,
  isOpen,
  onClose,
  onSaveEdits,
}) => {
  const [activeTool, setActiveTool] = useState<'none' | 'brightness' | 'contrast' | 'saturation'>('none');
  const [rotation, setRotation] = useState<number>(image?.rotation || 0);
  const [brightness, setBrightness] = useState<number>(0); // -50 to 50
  const [contrast, setContrast] = useState<number>(0);     // -50 to 50
  const [saturation, setSaturation] = useState<number>(0); // -50 to 50
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset>('original');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !image) return null;

  // Build filter CSS string
  const getFilterCss = (preset: FilterPreset): string => {
    let base = '';
    if (preset === 'vivid') {
      base = 'saturate(1.5) contrast(1.15) brightness(1.05)';
    } else if (preset === 'warm') {
      base = 'sepia(0.25) saturate(1.2) hue-rotate(-10deg) brightness(1.05)';
    } else if (preset === 'cool') {
      base = 'hue-rotate(20deg) saturate(1.1) brightness(1.05)';
    } else if (preset === 'bw') {
      base = 'grayscale(1) contrast(1.2) brightness(0.95)';
    }

    const bVal = 1 + brightness / 100;
    const cVal = 1 + contrast / 100;
    const sVal = 1 + saturation / 100;

    const adjustments = `brightness(${bVal}) contrast(${cVal}) saturate(${sVal})`;
    return base ? `${base} ${adjustments}` : adjustments;
  };

  const currentFilterStyle = getFilterCss(selectedFilter);

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveEdits(image.id, currentFilterStyle, rotation);
    setIsSaving(false);
    onClose();
  };

  const presets: { id: FilterPreset; name: string; filterPreview: string }[] = [
    { id: 'original', name: 'Original', filterPreview: 'none' },
    { id: 'vivid', name: 'Vivid', filterPreview: 'saturate(1.5) contrast(1.15)' },
    { id: 'warm', name: 'Warm', filterPreview: 'sepia(0.3) saturate(1.2)' },
    { id: 'cool', name: 'Cool', filterPreview: 'hue-rotate(20deg) saturate(1.1)' },
    { id: 'bw', name: 'B&W', filterPreview: 'grayscale(1) contrast(1.2)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0e14] text-white select-none animate-in fade-in duration-150">
      {/* Top Header matching Mockup Screen 5: ArrowLeft, "Edit", "Save" */}
      <div className="h-16 px-4 flex items-center justify-between z-40 border-b border-zinc-800/80 bg-[#0d1017]">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-white font-sans">Edit</h2>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3.5 py-1.5 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Main Preview Canvas */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-black/40">
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={getSafeImageUrl(image)}
            alt="Editing Preview"
            crossOrigin="anonymous"
            className="max-w-full max-h-full object-contain rounded-lg transition-all duration-150"
            style={{
              transform: `rotate(${rotation}deg)`,
              filter: currentFilterStyle,
            }}
            onError={(e) => {
              const target = e.currentTarget;
              const fallback = `/api/raw/${image.id}`;
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
          />
        </div>
      </div>

      {/* Active Slider if tool is selected */}
      {activeTool !== 'none' && (
        <div className="px-6 py-2 bg-[#121620] border-t border-zinc-800/60 flex items-center gap-4 text-xs font-mono">
          <span className="capitalize text-zinc-400 w-20">{activeTool}</span>
          <input
            type="range"
            min="-50"
            max="50"
            value={
              activeTool === 'brightness'
                ? brightness
                : activeTool === 'contrast'
                ? contrast
                : saturation
            }
            onChange={(e) => {
              const val = Number(e.target.value);
              if (activeTool === 'brightness') setBrightness(val);
              else if (activeTool === 'contrast') setContrast(val);
              else setSaturation(val);
            }}
            className="flex-1 accent-blue-500"
          />
          <span className="w-8 text-right text-blue-400 font-bold">
            {activeTool === 'brightness'
              ? brightness
              : activeTool === 'contrast'
              ? contrast
              : saturation}
          </span>
        </div>
      )}

      {/* Tools Row matching Mockup Screen 5: Crop, Rotate, Brightness, Contrast, Saturation */}
      <div className="h-16 px-4 bg-[#10141d] border-t border-zinc-800/80 flex items-center justify-around text-zinc-400">
        <button
          onClick={() => setActiveTool('none')}
          className="flex flex-col items-center gap-1 p-2 hover:text-white"
          title="Crop"
        >
          <Crop className="w-4 h-4" />
          <span className="text-[10px]">Crop</span>
        </button>

        <button
          onClick={handleRotate}
          className="flex flex-col items-center gap-1 p-2 hover:text-white"
          title="Rotate 90°"
        >
          <RotateCw className="w-4 h-4" />
          <span className="text-[10px]">Rotate</span>
        </button>

        <button
          onClick={() => setActiveTool(activeTool === 'brightness' ? 'none' : 'brightness')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            activeTool === 'brightness' ? 'text-blue-400' : 'hover:text-white'
          }`}
          title="Brightness"
        >
          <Sun className="w-4 h-4" />
          <span className="text-[10px]">Brightness</span>
        </button>

        <button
          onClick={() => setActiveTool(activeTool === 'contrast' ? 'none' : 'contrast')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            activeTool === 'contrast' ? 'text-blue-400' : 'hover:text-white'
          }`}
          title="Contrast"
        >
          <Contrast className="w-4 h-4" />
          <span className="text-[10px]">Contrast</span>
        </button>

        <button
          onClick={() => setActiveTool(activeTool === 'saturation' ? 'none' : 'saturation')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            activeTool === 'saturation' ? 'text-blue-400' : 'hover:text-white'
          }`}
          title="Saturation"
        >
          <Droplets className="w-4 h-4" />
          <span className="text-[10px]">Saturation</span>
        </button>
      </div>

      {/* Preset Filters Row matching Mockup Screen 5: Original, Vivid, Warm, Cool, B&W */}
      <div className="h-24 px-4 bg-[#0a0d14] border-t border-zinc-800/80 flex items-center justify-center gap-3.5 overflow-x-auto">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedFilter(p.id)}
            className={`flex flex-col items-center gap-1.5 shrink-0 ${
              selectedFilter === p.id ? 'scale-105' : 'opacity-60 hover:opacity-90'
            }`}
          >
            <div
              className={`w-13 h-13 rounded-xl overflow-hidden border-2 transition-all ${
                selectedFilter === p.id ? 'border-blue-500 shadow-md shadow-blue-500/30' : 'border-zinc-800'
              }`}
            >
              <img
                src={image.rawUrl}
                alt={p.name}
                className="w-full h-full object-cover"
                style={{ filter: p.filterPreview }}
              />
            </div>
            <span
              className={`text-[10px] font-medium ${
                selectedFilter === p.id ? 'text-blue-400 font-bold' : 'text-zinc-400'
              }`}
            >
              {p.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
