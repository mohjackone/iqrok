/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8000',
  },
  images: {
    domains: ['render.com'],
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    // Fix module resolution
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname, './src'),
      },
    };

    return config;
  },
  // Ensure proper transpilation
  transpilePackages: ['@tabler/icons-react'],
  // Add output configuration
  output: 'standalone',
  // Add proper distDir
  distDir: '.next',
  // Experimental features
  experimental: {
    esmExternals: true,
    optimizeCss: true,
  },
  compiler: {
    removeConsole: false,
  },
  // Configure SWC
  swcMinify: true,
}

module.exports = nextConfig
