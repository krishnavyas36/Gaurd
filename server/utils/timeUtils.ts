// Server-side time utilities for EST timezone handling

export function getCurrentESTTimestamp(): string {
  // Get current time in EST/EDT (automatically handles DST)
  const now = new Date();
  
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

  const parts = estFormatter.formatToParts(now);
  const estDateString = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}T${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}:${parts.find(p => p.type === 'second')?.value}`;
  
  return estDateString;
}

export function formatDateTimeEST(date: Date = new Date()): string {
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
  }).format(date);
}

export function toESTString(utcTimestamp: string | Date): string {
  const date = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;
  return formatDateTimeEST(date);
}