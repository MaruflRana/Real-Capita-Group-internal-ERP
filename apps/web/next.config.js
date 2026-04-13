//@ts-check

const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  nx: {},
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@real-capita/ui'],
};
module.exports = composePlugins(withNx)(nextConfig);
