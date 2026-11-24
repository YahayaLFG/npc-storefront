import { NextResponse } from 'next/server';
import { logServerError } from '@/lib/server-error';

export async function POST(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return new NextResponse(null, { status: 403 });

  try {
    if (new URL(origin).host !== host) return new NextResponse(null, { status: 403 });
  } catch {
    return new NextResponse(null, { status: 403 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 12_000) return new NextResponse(null, { status: 413 });

  let payload;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 12_000) {
      return new NextResponse(null, { status: 413 });
    }
    payload = JSON.parse(body);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const errorId = String(payload?.errorId || '');
  const context = String(payload?.context || 'client.runtime').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 80);
  const name = String(payload?.name || 'Error').slice(0, 80);
  const message = String(payload?.message || 'Unknown client error').slice(0, 2000);
  const stack = String(payload?.stack || '').slice(0, 6000);

  logServerError(context || 'client.runtime', { name, message, stack }, errorId);
  return new NextResponse(null, { status: 204 });
}
