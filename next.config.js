/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // 🚀 Evita che Vercel analizzi i moduli Node interni di Clerk nel middleware Edge
  serverExternalPackages: ['@clerk/nextjs'],
};

module.exports = nextConfig;
