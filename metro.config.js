// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ─── Path alias resolution ─────────────────────────────────────────────────
// Mirrors the `paths` entries in tsconfig.json so Metro resolves @theme, @store,
// etc. the same way the TypeScript compiler does.
config.resolver.extraNodeModules = {
  '@theme': path.resolve(__dirname, 'theme'),
  '@store': path.resolve(__dirname, 'store'),
  '@components': path.resolve(__dirname, 'components'),
  '@services': path.resolve(__dirname, 'services'),
  '@hooks': path.resolve(__dirname, 'hooks'),
  '@utils': path.resolve(__dirname, 'utils'),
  '@constants': path.resolve(__dirname, 'constants'),
  '@context': path.resolve(__dirname, 'context'),
  '@config': path.resolve(__dirname, 'config'),
  '@app': path.resolve(__dirname, 'app'),
};

module.exports = config;
