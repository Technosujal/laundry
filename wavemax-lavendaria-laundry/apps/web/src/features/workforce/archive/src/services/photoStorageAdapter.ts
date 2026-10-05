// @ts-nocheck
/**
 * Photo Storage Adapter
 *
 * PRODUCTION ARCHITECTURE NOTE:
 * In a production environment, photos are NOT stored in browser storage.
 * The production pipeline:
 * 1. Client requests a short-lived pre-signed PUT URL:
 *    POST /api/v1/workforce/employees/:id/photo/upload-intent
 * 2. Client uploads image binary directly to private object storage (AWS S3, GCS, Cloudflare R2).
 * 3. Serverless worker validates MIME signature, strips EXIF, generates 64x64 and 256x256 WebP derivatives.
 * 4. Image metadata & private asset key stored in PostgreSQL.
 * 5. Client views photos via time-limited signed CDN URLs (e.g., CloudFront / Cloud CDN).
 *
 * PROTOTYPE IMPLEMENTATION:
 * Uses browser IndexedDB (`LaundryAI_WorkforcePhotos`) with in-memory fallback.
 * This completely avoids localStorage quota limitations (which error at ~5MB).
 */

const DB_NAME = 'LaundryAI_WorkforcePhotos';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

class PhotoStorageAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback: Map<string, string> = new Map();

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'employeeId' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return this.dbPromise;
  }

  async savePhoto(employeeId: string, dataUrl: string): Promise<string> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record = {
          employeeId,
          dataUrl,
          updatedAt: new Date().toISOString(),
        };
        const putReq = store.put(record);

        putReq.onsuccess = () => resolve(dataUrl);
        putReq.onerror = () => reject(putReq.error);
      });
    } catch {
      this.memoryFallback.set(employeeId, dataUrl);
      return dataUrl;
    }
  }

  async getPhoto(employeeId: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(employeeId);

        getReq.onsuccess = () => {
          if (getReq.result && getReq.result.dataUrl) {
            resolve(getReq.result.dataUrl);
          } else {
            resolve(this.memoryFallback.get(employeeId) || null);
          }
        };
        getReq.onerror = () => resolve(this.memoryFallback.get(employeeId) || null);
      });
    } catch {
      return this.memoryFallback.get(employeeId) || null;
    }
  }

  async deletePhoto(employeeId: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const delReq = store.delete(employeeId);

        delReq.onsuccess = () => {
          this.memoryFallback.delete(employeeId);
          resolve();
        };
        delReq.onerror = () => reject(delReq.error);
      });
    } catch {
      this.memoryFallback.delete(employeeId);
    }
  }
}

export const photoStorageAdapter = new PhotoStorageAdapter();
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
