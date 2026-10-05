// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { photoStorageAdapter } from '../../services/photoStorageAdapter';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus =
  | 'Active'
  | 'On Shift'
  | 'Clocked In'
  | 'On Break'
  | 'On Leave'
  | 'Late'
  | 'Absent'
  | 'Clocked Out';

export interface AvatarProps {
  src?: string;
  name?: string;
  employeeId?: string;
  alt?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  showStatus?: boolean;
  className?: string;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', dot: 'w-1.5 h-1.5 bottom-0 right-0' },
  sm: { container: 'w-8 h-8', text: 'text-xs', dot: 'w-2 h-2 bottom-0 right-0' },
  md: { container: 'w-10 h-10', text: 'text-sm font-semibold', dot: 'w-2.5 h-2.5 bottom-0 right-0' },
  lg: { container: 'w-14 h-14', text: 'text-lg font-bold', dot: 'w-3.5 h-3.5 bottom-0.5 right-0.5' },
  xl: { container: 'w-20 h-20', text: 'text-2xl font-bold', dot: 'w-4 h-4 bottom-1 right-1' },
};

const statusColors: Record<AvatarStatus, string> = {
  Active: 'bg-emerald-500 ring-white',
  'On Shift': 'bg-emerald-500 ring-white',
  'Clocked In': 'bg-emerald-500 ring-white',
  'On Break': 'bg-blue-500 ring-white',
  'On Leave': 'bg-amber-500 ring-white',
  Late: 'bg-amber-500 ring-white',
  Absent: 'bg-rose-500 ring-white',
  'Clocked Out': 'bg-gray-400 ring-white',
};

// Deterministic pleasing gradient backgrounds for initial avatars
const gradients = [
  'from-teal-600 to-teal-800 text-white',
  'from-cyan-600 to-blue-700 text-white',
  'from-indigo-600 to-violet-700 text-white',
  'from-emerald-600 to-teal-700 text-white',
  'from-slate-600 to-zinc-800 text-white',
  'from-blue-600 to-indigo-700 text-white',
];

function getGradient(seed: string = ''): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

function getInitials(name: string = ''): string {
  if (!name.trim()) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  src,
  name = '',
  employeeId,
  alt,
  size = 'md',
  status,
  showStatus = false,
  className = '',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [storedPhoto, setStoredPhoto] = useState<string | null>(null);

  // Check photoStorageAdapter if employeeId is provided and src isn't explicit
  useEffect(() => {
    let isMounted = true;
    if (employeeId && !src) {
      photoStorageAdapter.getPhoto(employeeId).then(photo => {
        if (isMounted && photo) {
          setStoredPhoto(photo);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [employeeId, src]);

  const activeSrc = src || storedPhoto;
  const initials = getInitials(name);
  const sizeConfig = sizeClasses[size];
  const bgGradient = getGradient(employeeId || name || 'CW');

  const showImage = activeSrc && !imageError;

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`${sizeConfig.container} rounded-full overflow-hidden flex items-center justify-center border border-gray-200/80 shadow-2xs select-none ${
          !showImage ? `bg-gradient-to-br ${bgGradient}` : 'bg-gray-100'
        }`}
      >
        {showImage ? (
          <img
            src={activeSrc}
            alt={alt || name || 'Employee Profile'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : initials ? (
          <span className={`${sizeConfig.text} font-bold tracking-tight`}>{initials}</span>
        ) : (
          <User className="w-1/2 h-1/2 opacity-75" />
        )}
      </div>

      {showStatus && status && statusColors[status] && (
        <span
          className={`absolute ${sizeConfig.dot} rounded-full ring-2 ${statusColors[status]}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
