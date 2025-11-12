/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://backend-php.test/api/v1',
  },
  webpack: (config, { isServer }) => {
    // Excluir la carpeta backend-php del proceso de build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/backend-php/**', '**/node_modules/**'],
    }
    return config
  },
}

export default nextConfig
