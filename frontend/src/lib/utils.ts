import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateString);
}

export function formatPhoneNumber(phone: string): string {
  // Format: 254XXXXXXXXX -> 07XX XXX XXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    const national = '0' + cleaned.slice(3);
    return `${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`;
  }
  return phone;
}

export function normalizePhoneNumber(phone: string): string {
  // Normalize to 254XXXXXXXXX format
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
    return '254' + cleaned;
  }

  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return '254' + cleaned.slice(1);
  }

  if (cleaned.length === 12 && cleaned.startsWith('254')) {
    return cleaned;
  }

  if (cleaned.length === 13 && cleaned.startsWith('+254')) {
    return cleaned.slice(1);
  }

  return cleaned;
}

export function isValidKenyanPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length !== 12) return false;
  if (!normalized.startsWith('254')) return false;

  const prefix = normalized.slice(3, 5);
  const validPrefixes = ['70', '71', '72', '74', '75', '76', '79', '10', '11', '73', '78', '77'];
  return validPrefixes.includes(prefix);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
}

export function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function getVimeoVideoId(url: string): string | null {
  const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
  const match = url.match(regExp);
  return match ? match[3] : null;
}

export function getRatingColor(rating: string | null): string {
  switch (rating) {
    case 'G':
      return 'bg-green-500';
    case 'PG':
      return 'bg-blue-500';
    case 'PG-13':
      return 'bg-yellow-500';
    case 'R':
    case '18+':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}
