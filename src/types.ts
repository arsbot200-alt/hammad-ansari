export interface ImageRecord {
  id: string;
  originalName: string;
  diskFilename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  sha256?: string;
  width?: number;
  height?: number;
  tag?: string;
  album?: string;
  isFavorite?: boolean;
  isTrash?: boolean;
  trashedAt?: string;
  filterApplied?: string;
  rotation?: number;
  source?: 'web_upload' | 'api_bulk' | 'api_raw' | 'api_base64' | 'clipboard' | 'seed';
  rawUrl: string;
  downloadUrl: string;
  cameraModel?: string;
  focalLength?: string;
  aperture?: string;
  iso?: string;
}

export interface StorageStats {
  totalImages: number;
  totalSizeBytes: number;
  formattedSize: string;
  favoriteCount: number;
  trashCount?: number;
  trashSizeBytes?: number;
  formattedTrashSize?: string;
  albums?: { name: string; count: number }[];
  tags: string[];
}

export interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  previewUrl?: string;
}

export type NavTab = 'photos' | 'albums' | 'favorites' | 'explore' | 'trash' | 'settings';
export type SubTab = 'photos' | 'albums' | 'explore';
export type FilterPreset = 'original' | 'vivid' | 'warm' | 'cool' | 'bw';

export interface PhotoEditState {
  brightness: number; // -50 to 50
  contrast: number;   // -50 to 50
  saturation: number; // -50 to 50
  rotation: number;   // 0, 90, 180, 270
  filter: FilterPreset;
}
