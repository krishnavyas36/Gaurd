// Time utilities for EST timezone conversion

export function toEST(date: Date | string): Date {
  const utcDate = typeof date === 'string' ? new Date(date) : date;
  
  // Eastern Time is UTC-5 (EST) or UTC-4 (EDT)
  // Using Intl.DateTimeFormat to handle DST automatically
  const estFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = estFormatter.formatToParts(utcDate);
  const estDateString = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}T${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}:${parts.find(p => p.type === 'second')?.value}`;
  
  return new Date(estDateString);
}

export function formatTimeAgoEST(timestamp: string): string {
  const now = new Date();
  const estNow = toEST(now);
  const estTime = toEST(timestamp);
  
  const diffMs = estNow.getTime() - estTime.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

export function formatFullDateTimeEST(timestamp: string): string {
  const estDate = toEST(timestamp);
  
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  }).format(new Date(timestamp));
}

export function formatShortTimeEST(timestamp: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  }).format(new Date(timestamp));
}

export function getCurrentESTString(): string {
  return formatFullDateTimeEST(new Date().toISOString());
}