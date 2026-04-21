const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .wasm to asset extensions so expo-sqlite web support works
config.resolver.assetExts.push('wasm');

// Allow Metro to resolve .wasm files as source when imported directly
config.resolver.sourceExts.push('wasm');

module.exports = config;
