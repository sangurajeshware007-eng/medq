module.exports = {
  preset: 'react-native',
  // Direct file path — the package's "exports" map doesn't expose the jest subpath.
  setupFiles: ['./node_modules/@react-native-google-signin/google-signin/jest/build/jest/setup.js'],
  // google-signin ships untranspiled ESM — let babel transform it.
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-google-signin|expo|expo-.*|@expo)/)',
  ],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
};
