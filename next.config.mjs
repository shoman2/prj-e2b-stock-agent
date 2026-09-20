/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@e2b/code-interpreter'],
  },
};

export default nextConfig;
