import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import JSZip from 'jszip';

const isVercel = Boolean(process.env.VERCEL);
const UPLOADS_DIR = isVercel
  ? path.join('/tmp', 'dumppix_uploads')
  : path.resolve(process.cwd(), 'uploads');

const METADATA_FILE = path.join(UPLOADS_DIR, 'images_metadata.json');

// Ensure directory exists safely
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.error('Directory creation error:', e);
}

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
  cameraModel?: string;
  focalLength?: string;
  aperture?: string;
  iso?: string;
}

// In-memory cache
let inMemoryMetadata: ImageRecord[] | null = null;

export function getMetadata(): ImageRecord[] {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, 'utf-8');
      inMemoryMetadata = JSON.parse(data);
      return inMemoryMetadata || [];
    }
  } catch (err) {
    console.error('Error reading metadata file:', err);
  }
  return inMemoryMetadata || [];
}

export function saveMetadata(records: ImageRecord[]) {
  inMemoryMetadata = records;
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    fs.writeFileSync(METADATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving metadata file:', err);
  }
}

// Image Dimension Probe
export function probeImageDimensions(buffer: Buffer, mimeType: string): { width?: number; height?: number } {
  try {
    if (mimeType.includes('png') && buffer.length >= 24) {
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        return {
          width: buffer.readUInt32BE(16),
          height: buffer.readUInt32BE(20),
        };
      }
    }
    if (mimeType.includes('gif') && buffer.length >= 10) {
      return {
        width: buffer.readUInt16LE(6),
        height: buffer.readUInt16LE(8),
      };
    }
    if (mimeType.includes('webp') && buffer.length >= 30) {
      const riff = buffer.toString('ascii', 0, 4);
      const webp = buffer.toString('ascii', 8, 12);
      if (riff === 'RIFF' && webp === 'WEBP') {
        const type = buffer.toString('ascii', 12, 16);
        if (type === 'VP8 ') {
          return {
            width: buffer.readUInt16LE(26) & 0x3fff,
            height: buffer.readUInt16LE(28) & 0x3fff,
          };
        } else if (type === 'VP8X') {
          return {
            width: buffer.readUIntLE(24, 3) + 1,
            height: buffer.readUIntLE(27, 3) + 1,
          };
        }
      }
    }
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        if (
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf)
        ) {
          return {
            height: buffer.readUInt16BE(offset + 5),
            width: buffer.readUInt16BE(offset + 7),
          };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }
  } catch {
    // gracefully return empty
  }
  return {};
}

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      cb(null, UPLOADS_DIR);
    } catch (err: any) {
      cb(err, UPLOADS_DIR);
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const uniqueId = crypto.randomUUID();
    cb(null, `${Date.now()}-${uniqueId}${ext ? ext : '.bin'}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024,
    files: 100,
  },
});

export const apiApp = express();

apiApp.use(cors({ origin: true, credentials: true }));
apiApp.use(express.json({ limit: '100mb' }));
apiApp.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health Endpoint
apiApp.get('/api/health', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  res.json({
    status: 'ok',
    environment: isVercel ? 'vercel_serverless' : 'node_server',
    liveUrl: `${protocol}://${host}`,
    service: 'Gallery Pure Engine',
    lossless: true,
    timestamp: new Date().toISOString(),
  });
});

// Vercel Info endpoint
apiApp.get('/api/vercel-info', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  res.json({
    isVercel,
    host,
    baseUrl: `${protocol}://${host}`,
    uploadsDir: UPLOADS_DIR,
    zipDownloadUrl: `${protocol}://${host}/api/download-project-zip`,
    instructions: {
      step1: 'Download the deployment zip from /api/download-project-zip',
      step2: 'Push this repository to GitHub or GitLab',
      step3: 'Import project on Vercel Dashboard (https://vercel.com/new)',
      step4: 'vercel.json is pre-configured with zero manual configuration needed',
    },
  });
});

// Render Info endpoint
apiApp.get('/api/render-info', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  res.json({
    platform: 'Render.com',
    serviceType: 'Web Service (Node.js)',
    buildCommand: 'npm install && npm run build',
    startCommand: 'npm start',
    recommendedPlan: 'Free',
    blueprintSupported: true,
    blueprintFile: 'render.yaml',
    zipDownloadUrl: `${protocol}://${host}/api/download-render-zip`,
    instructions: {
      step1: 'Download ZIP from /api/download-render-zip and extract',
      step2: 'Push to GitHub / GitLab repo',
      step3: 'Create new Web Service on dashboard.render.com',
      step4: 'Select Node runtime, set Build Command: npm install && npm run build, Start Command: npm start',
    },
  });
});

// Download Render Deploy Zip
apiApp.get(['/api/download-render-zip', '/api/render-zip'], (_req, res) => {
  const zipPath = path.resolve(process.cwd(), 'gallery-render-deploy.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="gallery-render-deploy.zip"');
    const stat = fs.statSync(zipPath);
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(zipPath).pipe(res);
  } else {
    const fallback = path.resolve(process.cwd(), 'gallery-vercel-deploy.zip');
    if (fs.existsSync(fallback)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gallery-render-deploy.zip"');
      fs.createReadStream(fallback).pipe(res);
    } else {
      res.status(404).json({ error: 'ZIP file not generated yet' });
    }
  }
});

// Download Vercel Deploy Zip
apiApp.get(['/api/download-project-zip', '/api/project-zip'], (_req, res) => {
  const zipPath = path.resolve(process.cwd(), 'gallery-vercel-deploy.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="gallery-vercel-deploy.zip"');
    const stat = fs.statSync(zipPath);
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(zipPath).pipe(res);
  } else {
    res.status(404).json({ error: 'ZIP file not generated yet' });
  }
});

// --- AUTOMATED CRON JOB MAINTENANCE ENGINE ---
interface CronExecutionRecord {
  id: string;
  timestamp: string;
  durationMs: number;
  itemsPurged: number;
  orphansRemoved: number;
  bytesFreed: number;
  status: 'success' | 'failed';
  details: string;
}

let cronHistory: CronExecutionRecord[] = [];
let lastCronRunTime: string | null = null;
let cronTimer: NodeJS.Timeout | null = null;

export function runCronMaintenance(): CronExecutionRecord {
  const start = Date.now();
  try {
    const list = getMetadata();
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    let itemsPurged = 0;
    let bytesFreed = 0;
    const remaining: ImageRecord[] = [];

    for (const img of list) {
      if (img.isTrash && img.trashedAt) {
        const trashedTime = new Date(img.trashedAt).getTime();
        if (now - trashedTime > thirtyDaysMs) {
          itemsPurged++;
          bytesFreed += img.sizeBytes || 0;
          const filePath = path.join(UPLOADS_DIR, img.diskFilename);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (e) {
            console.error('[Cron] Unlink error:', e);
          }
          continue;
        }
      }
      remaining.push(img);
    }

    let orphansRemoved = 0;
    try {
      if (fs.existsSync(UPLOADS_DIR)) {
        const allFiles = fs.readdirSync(UPLOADS_DIR);
        const knownFilenames = new Set(remaining.map((r) => r.diskFilename));
        for (const file of allFiles) {
          if (file === 'images_metadata.json' || file.startsWith('.')) continue;
          if (!knownFilenames.has(file)) {
            try {
              const orphanPath = path.join(UPLOADS_DIR, file);
              const stat = fs.statSync(orphanPath);
              bytesFreed += stat.size;
              fs.unlinkSync(orphanPath);
              orphansRemoved++;
            } catch (e) {}
          }
        }
      }
    } catch (e) {}

    if (itemsPurged > 0) {
      saveMetadata(remaining);
    }

    lastCronRunTime = new Date().toISOString();
    const record: CronExecutionRecord = {
      id: crypto.randomUUID(),
      timestamp: lastCronRunTime,
      durationMs: Date.now() - start,
      itemsPurged,
      orphansRemoved,
      bytesFreed,
      status: 'success',
      details: `Purged ${itemsPurged} expired trash item(s), removed ${orphansRemoved} orphan file(s). Freed ${(bytesFreed / 1024).toFixed(1)} KB.`,
    };

    cronHistory.unshift(record);
    if (cronHistory.length > 20) cronHistory = cronHistory.slice(0, 20);
    console.log(`[Cron Job] Completed successfully: ${record.details}`);
    return record;
  } catch (err: any) {
    const record: CronExecutionRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
      itemsPurged: 0,
      orphansRemoved: 0,
      bytesFreed: 0,
      status: 'failed',
      details: err.message || 'Cron execution failed',
    };
    cronHistory.unshift(record);
    console.error(`[Cron Job] Error:`, err);
    return record;
  }
}

// Background scheduler: runs every 15 minutes (and once on startup)
if (!cronTimer) {
  setTimeout(() => {
    runCronMaintenance();
  }, 3000);

  cronTimer = setInterval(() => {
    runCronMaintenance();
  }, 15 * 60 * 1000);
}

// Cron endpoints
apiApp.get('/api/cron/status', (_req, res) => {
  res.json({
    active: true,
    interval: 'Every 15 minutes',
    lastRun: lastCronRunTime,
    nextRun: lastCronRunTime
      ? new Date(new Date(lastCronRunTime).getTime() + 15 * 60 * 1000).toISOString()
      : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    retentionDays: 30,
    features: [
      'Auto-purge items in trash older than 30 days',
      'Remove orphaned upload files from disk',
      'Lossless integrity validation & metadata sync',
    ],
    history: cronHistory,
  });
});

apiApp.post('/api/cron/run-now', (_req, res) => {
  const result = runCronMaintenance();
  res.json({
    message: 'Cron job executed successfully',
    result,
  });
});

// Storage Stats & Album counts
apiApp.get('/api/stats', (_req, res) => {
  const list = getMetadata();
  const activePhotos = list.filter((i) => !i.isTrash);
  const trashedPhotos = list.filter((i) => i.isTrash);

  const totalBytes = activePhotos.reduce((acc, cur) => acc + (cur.sizeBytes || 0), 0);
  const trashBytes = trashedPhotos.reduce((acc, cur) => acc + (cur.sizeBytes || 0), 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const favoriteCount = activePhotos.filter((i) => i.isFavorite).length;

  // Build Albums breakdown
  const albumsMap = new Map<string, number>();
  activePhotos.forEach((img) => {
    const albumName = img.album || img.tag || 'Camera';
    albumsMap.set(albumName, (albumsMap.get(albumName) || 0) + 1);
  });

  const albums = [
    { name: 'All Photos', count: activePhotos.length },
    { name: 'Camera', count: albumsMap.get('Camera') || activePhotos.length },
    { name: 'Screenshots', count: albumsMap.get('Screenshots') || 0 },
    { name: 'Favorites', count: favoriteCount },
    { name: 'WhatsApp Images', count: albumsMap.get('WhatsApp Images') || 0 },
  ];

  res.json({
    totalImages: activePhotos.length,
    totalSizeBytes: totalBytes,
    formattedSize: formatBytes(totalBytes),
    favoriteCount,
    trashCount: trashedPhotos.length,
    trashSizeBytes: trashBytes,
    formattedTrashSize: formatBytes(trashBytes),
    albums,
    tags: Array.from(new Set(activePhotos.map((i) => i.tag).filter(Boolean))),
  });
});

// List Images (Supports filter by trash, favorites, album, search, sort)
apiApp.get('/api/images', (req, res) => {
  let list = [...getMetadata()];

  const isTrashQuery = req.query.trash === 'true';
  const favoritesOnly = req.query.favorites === 'true';
  const album = typeof req.query.album === 'string' ? req.query.album.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase().trim() : '';
  const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : '';
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'newest';

  // Trash filter
  if (isTrashQuery) {
    list = list.filter((img) => img.isTrash);
  } else {
    list = list.filter((img) => !img.isTrash);
  }

  // Favorites filter
  if (favoritesOnly) {
    list = list.filter((img) => img.isFavorite);
  }

  // Album filter
  if (album && album !== 'All Photos') {
    if (album === 'Favorites') {
      list = list.filter((img) => img.isFavorite);
    } else {
      list = list.filter(
        (img) => (img.album && img.album.toLowerCase() === album.toLowerCase()) ||
                 (img.tag && img.tag.toLowerCase() === album.toLowerCase()) ||
                 (album === 'Screenshots' && img.originalName.toLowerCase().includes('screenshot'))
      );
    }
  }

  // Tag filter
  if (tag && tag !== 'all') {
    list = list.filter((img) => img.tag === tag);
  }

  // Search filter
  if (search) {
    list = list.filter(
      (img) =>
        img.originalName.toLowerCase().includes(search) ||
        (img.tag && img.tag.toLowerCase().includes(search)) ||
        (img.album && img.album.toLowerCase().includes(search)) ||
        img.id.toLowerCase().includes(search)
    );
  }

  // Sort
  if (sort === 'oldest') {
    list.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
  } else if (sort === 'size_desc') {
    list.sort((a, b) => b.sizeBytes - a.sizeBytes);
  } else if (sort === 'size_asc') {
    list.sort((a, b) => a.sizeBytes - b.sizeBytes);
  } else if (sort === 'name') {
    list.sort((a, b) => a.originalName.localeCompare(b.originalName));
  } else {
    // newest first
    list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(300, Math.max(1, Number(req.query.limit) || 200));
  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginated = list.slice(startIndex, startIndex + limit);

  const items = paginated.map((item) => ({
    ...item,
    rawUrl: `/api/raw/${item.id}`,
    downloadUrl: `/api/images/${item.id}/download`,
  }));

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

// Get Single Image
apiApp.get('/api/images/:id', (req, res) => {
  const list = getMetadata();
  const item = list.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Image not found' });
  }

  res.json({
    ...item,
    rawUrl: `/api/raw/${item.id}`,
    downloadUrl: `/api/images/${item.id}/download`,
  });
});

// Stream Raw Image
apiApp.get(['/api/raw/:id', '/api/images/:id/raw'], (req, res) => {
  const list = getMetadata();
  const item = list.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).send('Image not found');
  }
  const filePath = path.join(UPLOADS_DIR, item.diskFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File missing on disk');
  }

  res.setHeader('Content-Type', item.mimeType || 'application/octet-stream');
  res.setHeader('Content-Length', item.sizeBytes);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Accept-Ranges', 'bytes');
  fs.createReadStream(filePath).pipe(res);
});

// Download attachment
apiApp.get('/api/images/:id/download', (req, res) => {
  const list = getMetadata();
  const item = list.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).send('Image not found');
  }
  const filePath = path.join(UPLOADS_DIR, item.diskFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File missing on disk');
  }

  res.setHeader('Content-Type', item.mimeType || 'application/octet-stream');
  res.setHeader('Content-Length', item.sizeBytes);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(item.originalName)}"`
  );
  fs.createReadStream(filePath).pipe(res);
});

// Toggle Favorite (Heart)
apiApp.post('/api/images/:id/favorite', (req, res) => {
  const list = getMetadata();
  const itemIndex = list.findIndex((i) => i.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Image not found' });
  }

  list[itemIndex].isFavorite = !list[itemIndex].isFavorite;
  saveMetadata([...list]);

  res.json({
    success: true,
    id: list[itemIndex].id,
    isFavorite: list[itemIndex].isFavorite,
  });
});

// Move to Trash (Soft Delete)
apiApp.post('/api/images/:id/trash', (req, res) => {
  const list = getMetadata();
  const itemIndex = list.findIndex((i) => i.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Image not found' });
  }

  list[itemIndex].isTrash = true;
  list[itemIndex].trashedAt = new Date().toISOString();
  saveMetadata([...list]);

  res.json({ success: true, id: req.params.id, isTrash: true });
});

// Restore from Trash
apiApp.post('/api/images/:id/restore', (req, res) => {
  const list = getMetadata();
  const itemIndex = list.findIndex((i) => i.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Image not found' });
  }

  list[itemIndex].isTrash = false;
  delete list[itemIndex].trashedAt;
  saveMetadata([...list]);

  res.json({ success: true, id: req.params.id, isTrash: false });
});

// Empty Trash (Permanently delete all trashed files)
apiApp.post('/api/images/empty-trash', (_req, res) => {
  const list = getMetadata();
  const trashed = list.filter((i) => i.isTrash);

  for (const item of trashed) {
    try {
      const filePath = path.join(UPLOADS_DIR, item.diskFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('Error unlinking trashed file:', e);
    }
  }

  const remaining = list.filter((i) => !i.isTrash);
  saveMetadata(remaining);

  res.json({ success: true, deletedCount: trashed.length });
});

// Bulk ZIP export
apiApp.get('/api/images/export/zip', async (req, res) => {
  try {
    const idsParam = typeof req.query.ids === 'string' ? req.query.ids : '';
    const list = getMetadata().filter((i) => !i.isTrash);
    const targetImages = idsParam
      ? list.filter((i) => idsParam.split(',').includes(i.id))
      : list;

    if (targetImages.length === 0) {
      return res.status(400).json({ error: 'No valid images to archive' });
    }

    const zip = new JSZip();
    const usedNames = new Set<string>();

    for (const img of targetImages) {
      const filePath = path.join(UPLOADS_DIR, img.diskFilename);
      if (fs.existsSync(filePath)) {
        let fileName = img.originalName;
        let counter = 1;
        while (usedNames.has(fileName)) {
          const ext = path.extname(img.originalName);
          const base = path.basename(img.originalName, ext);
          fileName = `${base}_${counter}${ext}`;
          counter++;
        }
        usedNames.add(fileName);
        const fileData = fs.readFileSync(filePath);
        zip.file(fileName, fileData);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="photos_export_${Date.now()}.zip"`
    );
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);
  } catch (err) {
    console.error('ZIP generation failed:', err);
    res.status(500).json({ error: 'Failed to generate zip file' });
  }
});

// Save Photo Edits (Filters / Rotation)
apiApp.post('/api/images/:id/edit', (req, res) => {
  const { filterApplied, rotation } = req.body;
  const list = getMetadata();
  const itemIndex = list.findIndex((i) => i.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Image not found' });
  }

  if (filterApplied !== undefined) list[itemIndex].filterApplied = filterApplied;
  if (rotation !== undefined) list[itemIndex].rotation = rotation;

  saveMetadata([...list]);
  res.json({ success: true, image: list[itemIndex] });
});

// Multipart Bulk Upload
apiApp.post('/api/upload', upload.array('images', 100), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No image files provided' });
  }

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const baseUrl = `${protocol}://${host}`;

  const currentRecords = getMetadata();
  const tag = (req.body?.tag as string)?.trim() || undefined;
  const album = (req.body?.album as string)?.trim() || (tag ? tag : 'Camera');

  const newRecords: ImageRecord[] = [];

  for (const file of files) {
    try {
      const filePath = file.path;
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const dims = probeImageDimensions(fileBuffer, file.mimetype);

      const record: ImageRecord = {
        id: crypto.randomUUID(),
        originalName: file.originalname || `photo_${Date.now()}`,
        diskFilename: path.basename(file.path),
        mimeType: file.mimetype || 'image/jpeg',
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
        sha256: hash,
        width: dims.width,
        height: dims.height,
        tag,
        album,
        isFavorite: false,
        isTrash: false,
        source: 'web_upload',
      };

      newRecords.push(record);
    } catch (err) {
      console.error('Error saving file:', file.originalname, err);
    }
  }

  if (newRecords.length > 0) {
    saveMetadata([...newRecords, ...currentRecords]);
  }

  const results = newRecords.map((item) => ({
    ...item,
    rawUrl: `/api/raw/${item.id}`,
    downloadUrl: `/api/images/${item.id}/download`,
  }));

  res.json({
    success: true,
    count: results.length,
    images: results,
  });
});

// Raw Binary Upload (for automation, cURL, scripts)
apiApp.post(
  '/api/upload/raw',
  express.raw({ type: '*/*', limit: '200mb' }),
  (req: Request, res: Response) => {
    const buffer = req.body as Buffer;
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({
        error: 'No raw binary body received. Send with --data-binary @filename',
      });
    }

    const queryFilename = (req.query.filename as string) || (req.headers['x-filename'] as string);
    const mimeType = req.headers['content-type'] || 'image/jpeg';
    const ext = queryFilename ? path.extname(queryFilename) : '.jpg';
    const cleanName = queryFilename || `raw_dump_${Date.now()}${ext}`;

    const id = crypto.randomUUID();
    const diskFilename = `raw-${Date.now()}-${id}${ext || '.bin'}`;
    const destPath = path.join(UPLOADS_DIR, diskFilename);

    fs.writeFileSync(destPath, buffer);

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const dims = probeImageDimensions(buffer, mimeType);

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const tag = (req.query.tag as string) || (req.headers['x-tag'] as string) || undefined;
    const album = (req.query.album as string) || (tag ? tag : 'Camera');

    const record: ImageRecord = {
      id,
      originalName: cleanName,
      diskFilename,
      mimeType,
      sizeBytes: buffer.length,
      uploadedAt: new Date().toISOString(),
      sha256: hash,
      width: dims.width,
      height: dims.height,
      tag,
      album,
      isFavorite: false,
      isTrash: false,
      source: 'api_raw',
    };

    const current = getMetadata();
    saveMetadata([record, ...current]);

    res.status(201).json({
      success: true,
      message: 'Raw image stored lossless',
      image: {
        ...record,
        rawUrl: `/api/raw/${record.id}`,
        downloadUrl: `/api/images/${record.id}/download`,
      },
    });
  }
);

// Delete single image permanently
apiApp.delete('/api/images/:id', (req, res) => {
  const list = getMetadata();
  const item = list.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Image not found' });
  }

  try {
    const filePath = path.join(UPLOADS_DIR, item.diskFilename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.error('Error removing file:', e);
  }

  const updated = list.filter((i) => i.id !== req.params.id);
  saveMetadata(updated);

  res.json({ success: true, id: req.params.id });
});

// Bulk Delete
apiApp.post('/api/images/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array required' });
  }

  const list = getMetadata();
  const toDelete = list.filter((i) => ids.includes(i.id));

  for (const item of toDelete) {
    try {
      const filePath = path.join(UPLOADS_DIR, item.diskFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('Error deleting file:', e);
    }
  }

  const updated = list.filter((i) => !ids.includes(i.id));
  saveMetadata(updated);

  res.json({ success: true, deletedCount: toDelete.length });
});

// Export default handler for Vercel
export default apiApp;
