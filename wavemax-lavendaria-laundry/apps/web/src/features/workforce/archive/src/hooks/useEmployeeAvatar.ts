// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { photoStorageAdapter } from '../services/photoStorageAdapter';

export function useEmployeeAvatar(employeeId?: string, defaultUrl?: string) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaultUrl || null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (employeeId) {
      photoStorageAdapter.getPhoto(employeeId).then(cached => {
        if (isMounted && cached) {
          setPhotoUrl(cached);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [employeeId]);

  const uploadPhoto = useCallback(
    async (file: File): Promise<string> => {
      if (!employeeId) throw new Error('Cannot upload photo without employeeId');

      setLoading(true);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const dataUrl = reader.result as string;
            await photoStorageAdapter.savePhoto(employeeId, dataUrl);
            setPhotoUrl(dataUrl);
            setLoading(false);
            resolve(dataUrl);
          } catch (err) {
            setLoading(false);
            reject(err);
          }
        };
        reader.onerror = (err) => {
          setLoading(false);
          reject(err);
        };
        reader.readAsDataURL(file);
      });
    },
    [employeeId]
  );

  const deletePhoto = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    await photoStorageAdapter.deletePhoto(employeeId);
    setPhotoUrl(null);
    setLoading(false);
  }, [employeeId]);

  return {
    photoUrl,
    uploadPhoto,
    deletePhoto,
    loading,
  };
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
