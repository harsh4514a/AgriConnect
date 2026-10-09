import createNextIntlPlugin from 'next-intl/plugin';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@agri/domain-data'],
  // Keep `next dev` output isolated from production builds so one cannot
  // replace the other process's Webpack chunks while both are running.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/en/admin',
        permanent: false,
      },
      {
        source: '/admin/login',
        destination: '/en/admin/login',
        permanent: false,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self)',
      },
    ];

    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000',
      });
    }

    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
