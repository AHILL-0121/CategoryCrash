/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  // NOTE: no global CORS block here.
  //
  // The previous config sent `Access-Control-Allow-Origin: *` together with
  // `Access-Control-Allow-Credentials: true` on every /api route. Browsers
  // reject that pairing outright, and it left the token-spending AI routes open
  // to any origin. Each AI route now sets its own headers from an explicit
  // ALLOWED_ORIGINS allowlist (see lib/ai-support.ts); /api/room/create is
  // called same-origin and needs none.
};

module.exports = nextConfig;
