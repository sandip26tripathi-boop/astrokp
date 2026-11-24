/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    serverComponentsExternalPackages: ['@kuntay/swisseph', 'swisseph', 'sweph-wasm'],
  },
};

export default nextConfig;
