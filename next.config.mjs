/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@kuntay/swisseph', 'swisseph'],
  },
};

export default nextConfig;
