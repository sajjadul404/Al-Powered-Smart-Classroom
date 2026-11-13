const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH_BITS = 256;
const HASH_PREFIX = 'pbkdf2_sha256';

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex) {
  if (!hex || hex.length % 2 !== 0) return new Uint8Array(0);
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function derivePbkdf2Hex(password, saltBytes, iterations) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH_BITS
  );
  return bytesToHex(new Uint8Array(derivedBits));
}

export async function hashPassword(plainPassword) {
  if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
    throw new Error('Password must be a non-empty string.');
  }

  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const salt = new Uint8Array(16);
    globalThis.crypto.getRandomValues(salt);
    const hashHex = await derivePbkdf2Hex(plainPassword, salt, PBKDF2_ITERATIONS);
    return `${HASH_PREFIX}$${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${hashHex}`;
  }

  const resp = await fetch('/api/auth/hash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: plainPassword }),
  });
  if (!resp.ok) {
    throw new Error('Failed to hash password.');
  }
  const data = await resp.json();
  return data.passwordHash;
}

export async function verifyPassword(plainPassword, storedHash) {
  if (typeof plainPassword !== 'string' || typeof storedHash !== 'string' || !plainPassword || !storedHash) {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== HASH_PREFIX) {
    return false;
  }

  const iterations = Number(parts[1]);
  const saltHex = parts[2];
  const expectedHex = parts[3];
  if (!Number.isFinite(iterations) || iterations < 10000 || !saltHex || !expectedHex) {
    return false;
  }

  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const saltBytes = hexToBytes(saltHex);
    if (saltBytes.length === 0) return false;
    const candidateHex = await derivePbkdf2Hex(plainPassword, saltBytes, iterations);
    return constantTimeEqual(candidateHex, expectedHex);
  }

  const resp = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: plainPassword, passwordHash: storedHash }),
  });
  if (!resp.ok) return false;
  const data = await resp.json();
  return Boolean(data.valid);
}
