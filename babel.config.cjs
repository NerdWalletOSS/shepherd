module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' }, // Target the current Node.js version
        modules: 'auto',
      },
    ],
    '@babel/preset-typescript', // Handle TypeScript files
  ],
};
