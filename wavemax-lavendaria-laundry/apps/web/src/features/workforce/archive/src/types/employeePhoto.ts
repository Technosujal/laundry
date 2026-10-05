// @ts-nocheck
export type PhotoStatus = 'none' | 'uploaded' | 'processing' | 'active';

export interface EmployeePhoto {
  employeeId: string;
  photoUrl: string;
  photoThumbnailUrl?: string;
  photoUpdatedAt: string;
  photoStatus: PhotoStatus;
  mimeType?: string;
  fileSizeBytes?: number;
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
