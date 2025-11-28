import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Generate 10MB of dummy data
  const size = 10 * 1024 * 1024; // 10MB
  const buffer = new Uint8Array(size);
  
  // Fill with some data to avoid compression optimizations if any
  for (let i = 0; i < size; i += 1024) {
    buffer[i] = i % 255;
  }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': size.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
