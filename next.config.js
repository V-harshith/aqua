/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Ensure all .tsx files are treated as client components when they have 'use client'
  transpilePackages: [],
  // Force regeneration to avoid caching issues
  generateEtags: false,
  // Ensure proper handling of TypeScript files
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // PWA configuration
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: '',
    trailingSlash: false,
  }),
}

module.exports = nextConfig 