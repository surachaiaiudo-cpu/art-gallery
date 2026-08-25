// Edge-native Web Crypto HMAC session management for ARTVARA Admin

export const SESSION_COOKIE_NAME = 'artvara_admin_session';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Default secret and password for local development
export const DEFAULT_DEV_AUTH_SECRET = 'artvara_secret_local_dev_key_32_chars_long_min';
export const DEFAULT_DEV_ADMIN_PASSWORD = 'admin1234';

export function getEnvValue(key: string): string | undefined {
  try {
    const symbol = Symbol.for('__cloudflare-request-context__');
    const ctx = (globalThis as any)[symbol];
    if (ctx?.env && typeof ctx.env[key] === 'string' && ctx.env[key].trim()) {
      return ctx.env[key].trim();
    }
  } catch {}

  if (typeof (globalThis as any)[key] === 'string' && (globalThis as any)[key].trim()) {
    return (globalThis as any)[key].trim();
  }

  if (typeof process !== 'undefined' && process.env && typeof process.env[key] === 'string' && process.env[key].trim()) {
    return process.env[key].trim();
  }

  return undefined;
}

export function getAdminSecret(): string {
  return getEnvValue('AUTH_SECRET') || DEFAULT_DEV_AUTH_SECRET;
}

export function getAdminPassword(): string {
  return getEnvValue('ADMIN_PASSWORD') || DEFAULT_DEV_ADMIN_PASSWORD;
}

// Convert string to BufferSource
function textToBuffer(str: string): BufferSource {
  return new TextEncoder().encode(str) as unknown as BufferSource;
}

// Convert ArrayBuffer to Hex String
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Create CryptoKey from secret string
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    textToBuffer(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export interface SessionPayload {
  role: 'admin';
  exp: number; // Expiration timestamp in ms
}

/**
 * Generate a signed session token
 */
export async function createSessionToken(
  secret: string = getAdminSecret(),
  maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const payload: SessionPayload = {
    role: 'admin',
    exp: Date.now() + maxAgeSeconds * 1000,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = btoa(payloadStr);

  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    textToBuffer(payloadB64)
  );
  const signatureHex = bufferToHex(signatureBuffer);

  return `${payloadB64}.${signatureHex}`;
}

/**
 * Verify a session token against the secret and expiration time
 */
export async function verifySessionToken(
  token?: string | null,
  secret: string = getAdminSecret()
): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signatureHex] = parts;

  try {
    // 1. Verify signature
    const key = await getCryptoKey(secret);
    const expectedSigBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      textToBuffer(payloadB64)
    );
    const expectedSigHex = bufferToHex(expectedSigBuffer);

    if (signatureHex !== expectedSigHex) {
      return null;
    }

    // 2. Decode payload
    const payloadStr = atob(payloadB64);
    const payload: SessionPayload = JSON.parse(payloadStr);

    // 3. Check expiration
    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }

    if (payload.role !== 'admin') {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}
