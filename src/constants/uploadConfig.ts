/**
 * Client-Side Upload Constraints & Environment Synchronized Defaults
 * Matches Backend UPLOAD_DIR and MAX_UPLOAD_SIZE configurations
 */
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB (10485760 bytes)
export const MAX_UPLOAD_SIZE_MB = 10;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
];

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sizeFormatted?: string;
  isPdf?: boolean;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function validateUploadFile(
  file: File,
  maxSizeBytes = MAX_UPLOAD_SIZE_BYTES
): FileValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file selected.' };
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage =
    file.type.startsWith('image/') ||
    ['.jpg', '.jpeg', '.png', '.webp'].some((ext) => file.name.toLowerCase().endsWith(ext));

  if (!isImage && !isPdf) {
    return {
      isValid: false,
      error: `Unsupported file format '${file.name}'. Please upload a PNG, JPG, WebP image or PDF document.`,
      isPdf,
    };
  }

  if (file.size > maxSizeBytes) {
    const formattedCurrentSize = formatFileSize(file.size);
    const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      isValid: false,
      error: `File size (${formattedCurrentSize}) exceeds the maximum allowable limit of ${maxMB}MB. Please compress or select a smaller file.`,
      sizeFormatted: formattedCurrentSize,
      isPdf,
    };
  }

  return {
    isValid: true,
    sizeFormatted: formatFileSize(file.size),
    isPdf,
  };
}
