module.exports = {
  preset: 'ts-jest', // Keep ts-jest to handle TypeScript transformation
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.mts'],
  coveragePathIgnorePatterns: ['\\.mock\\.ts$'],
  moduleFileExtensions: ['ts', 'mts', 'tsx', 'js', 'mjs', 'jsx', 'json', 'node'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?|mts)$', // Regex to detect test files
  transform: {
    '^.+\\.(ts|mts|tsx|js|mjs)?$': 'babel-jest', // Use babel-jest for both TypeScript and JavaScript
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // Map ".js" to ".ts" in imports
  },
  // Explicitly transform the ES module dependencies
  transformIgnorePatterns: [
    '/node_modules/(?!(@octokit|before-after-hook|universal-user-agent|bottleneck|@octokit/core|@octokit/plugin-retry|@octokit/plugin-rest-endpoint-methods|@octokit/plugin-throttling)/)', // Ensure these node_modules are transformed
  ],
};
