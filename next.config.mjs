/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('tree-sitter', 'tree-sitter-javascript');
    }
    return config;
  },
};

export default nextConfig;
