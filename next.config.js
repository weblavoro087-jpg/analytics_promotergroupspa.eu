/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // 🚀 Dice a Webpack di simulare e correggere __dirname nelle librerie esterne obsolete
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.node = {
        __dirname: true,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
