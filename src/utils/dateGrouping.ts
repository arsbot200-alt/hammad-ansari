import { ImageRecord } from '../types';

export interface DateGroup {
  dateKey: string;
  displayDate: string;
  relativeTime: string;
  images: ImageRecord[];
}

export function groupImagesByDate(images: ImageRecord[]): DateGroup[] {
  const groupsMap = new Map<string, ImageRecord[]>();

  images.forEach((img) => {
    const d = new Date(img.uploadedAt);
    // YYYY-MM-DD key for sorting
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(img);
  });

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const result: DateGroup[] = [];

  // Sort groups by key descending (newest first)
  const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a));

  for (const key of sortedKeys) {
    const groupImgs = groupsMap.get(key)!;
    const parts = key.split('-').map(Number);
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);

    let relative = '';
    if (key === todayKey) {
      relative = 'Today';
    } else if (key === yesterdayKey) {
      relative = 'Yesterday';
    } else {
      relative = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    }

    const displayDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });

    result.push({
      dateKey: key,
      displayDate,
      relativeTime: relative,
      images: groupImgs,
    });
  }

  return result;
}
