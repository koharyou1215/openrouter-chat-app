const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Node.js v24との互換性のための設定
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.nodeModulesPaths = [require.resolve('react-native')];

module.exports = config; 