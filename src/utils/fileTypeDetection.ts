/**
 * File Type Detection Utilities
 * Determines file type categories and preview support based on file extension or MIME type
 */

export type FileCategory = 'pdf' | 'image' | 'text' | 'video' | 'document' | 'spreadsheet' | 'other';

export interface FileTypeInfo {
  category: FileCategory;
  canPreview: boolean;
  mimeType?: string;
  extension: string;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Determine file category and preview capability based on extension
 */
export function getFileTypeInfo(fileName: string): FileTypeInfo {
  const extension = getFileExtension(fileName);
  
  // PDF files
  if (extension === 'pdf') {
    return {
      category: 'pdf',
      canPreview: true,
      mimeType: 'application/pdf',
      extension
    };
  }
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return {
      category: 'image',
      canPreview: true,
      mimeType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      extension
    };
  }
  
  // Plain text files
  if (['txt', 'log', 'md', 'csv', 'json', 'xml'].includes(extension)) {
    return {
      category: 'text',
      canPreview: true,
      mimeType: 'text/plain',
      extension
    };
  }
  
  // Video files (limited preview support)
  if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
    return {
      category: 'video',
      canPreview: true,
      mimeType: `video/${extension}`,
      extension
    };
  }
  
  // Document files (no preview)
  if (['doc', 'docx', 'odt', 'rtf'].includes(extension)) {
    return {
      category: 'document',
      canPreview: false,
      mimeType: extension === 'docx' 
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/msword',
      extension
    };
  }
  
  // Spreadsheet files (no preview)
  if (['xls', 'xlsx', 'ods'].includes(extension)) {
    return {
      category: 'spreadsheet',
      canPreview: false,
      mimeType: extension === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/vnd.ms-excel',
      extension
    };
  }
  
  // Other/unknown files
  return {
    category: 'other',
    canPreview: false,
    extension
  };
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Parse size string (e.g., "2.5 MB") to bytes
 */
export function parseSizeToBytes(sizeString: string): number {
  const match = sizeString.match(/^([\d.]+)\s*([KMGT]?B)$/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  const multipliers: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  };
  
  return value * (multipliers[unit] || 1);
}
