module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Web bundles are classic scripts, where `import.meta` is a parse
          // error that blanks the whole app. zustand v5 (devtools middleware)
          // ships it — transform it away. No effect on native.
          unstable_transformImportMeta: true,
        },
      ],
    ],
  };
};
