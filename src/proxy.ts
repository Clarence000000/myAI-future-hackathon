// ============================================================
// ScamShield AI — Next.js Proxy (replaces middleware in Next.js 16+)
// Handles CORS for Chrome extension API requests
// ============================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Key',
};

export function proxy(request: NextRequest) {
  // Handle preflight
  const isPreflight = request.method === 'OPTIONS';

  if (isPreflight) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        ...corsOptions,
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Add CORS headers to actual responses
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
