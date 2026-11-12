import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Lazy: get JWT_SECRET per-request so it works on Cloudflare edge
function getKey() {
  let secret: string | undefined;
  try {
    const ctx = getRequestContext();
    secret = (ctx?.env as any)?.JWT_SECRET;
  } catch {
    // not in a request context (e.g. build time)
  }
  if (!secret) secret = process.env.JWT_SECRET;
  if (!secret) secret = 'super-secret-key-change-me-in-production';
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getKey());
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, getKey(), {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const session = cookies().get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  if (!session) return;

  const parsed = await decrypt(session);
  if (!parsed) return;

  parsed.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: 'session',
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  });
  return res;
}

export interface DownloadTokenPayload {
  purpose: 'asset_download';
  orderId: string;
  productId: string;
  assetId: string;
}

/**
 * Creates a cryptographically signed magic download token bound to a specific paid order, product, and asset.
 * Allows buyers to download their purchased files from email / another browser without needing a login cookie.
 */
export async function createDownloadToken(params: {
  orderId: string;
  productId: string;
  assetId: string;
}): Promise<string> {
  return await new SignJWT({
    purpose: 'asset_download',
    orderId: String(params.orderId),
    productId: String(params.productId),
    assetId: String(params.assetId),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('365d')
    .sign(getKey());
}

/**
 * Verifies a magic download token and ensures it is specifically issued for asset downloads.
 */
export async function verifyDownloadToken(token: string): Promise<DownloadTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ['HS256'],
    });
    if (
      payload &&
      payload.purpose === 'asset_download' &&
      typeof payload.orderId === 'string' &&
      typeof payload.productId === 'string' &&
      typeof payload.assetId === 'string'
    ) {
      return {
        purpose: 'asset_download',
        orderId: payload.orderId,
        productId: payload.productId,
        assetId: payload.assetId,
      };
    }
    return null;
  } catch {
    return null;
  }
}
