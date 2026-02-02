export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

export function parseOffset(value: string | null): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export function parseList(value: string | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
