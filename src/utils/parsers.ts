import type { AuthProvider } from '../types/user';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function readNullableString(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  return null;
}

export function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function readAuthProvider(value: unknown): AuthProvider | null {
  if (value === 'password' || value === 'google' || value === 'apple') {
    return value;
  }

  return null;
}
