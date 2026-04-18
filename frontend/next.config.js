/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isGithubPages ? '/QATestAutoBa3' : '',
  assetPrefix: isGithubPages ? '/QATestAutoBa3/' : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? '/QATestAutoBa3' : '',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
