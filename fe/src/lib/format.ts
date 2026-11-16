const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_URL || 'http://localhost:5000';

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function getImageUrl(relativePath?: string): string {
  if (!relativePath) {
    return `${ASSET_BASE}/uploads/seed/home.svg`;
  }
  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  return `${ASSET_BASE}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
}