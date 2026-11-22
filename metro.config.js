const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for .cjs extensions used by newer Firebase versions
config.resolver.sourceExts.push('cjs');

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // 1. Resolve React Native asset registry (needed for font and asset loading)
  if (moduleName === 'react-native/asset-registry') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/react-native/src/asset-registry.js'),
      type: 'sourceFile',
    };
  }

  // 2. Prevent Firebase dual-package hazard on React Native:
  //    @firebase/auth's "react-native" export points to CJS dist/rn/index.js which
  //    requires CJS @firebase/app, creating a second @firebase/app instance alongside
  //    ESM @firebase/app used by firebase/app & firebase/firestore.
  //    Routing @firebase/auth to its ESM bundle guarantees one shared @firebase/app instance.
  if (platform !== 'web' && moduleName === '@firebase/auth') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/@firebase/auth/dist/esm2017/index.js'),
      type: 'sourceFile',
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
