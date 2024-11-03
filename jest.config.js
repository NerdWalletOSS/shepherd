export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.mts'],
  coveragePathIgnorePatterns: ['\\.mock\\.ts$'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleFileExtensions: ['ts', 'mts', 'tsx', 'js', 'mjs', 'jsx', 'json', 'node'],
  testRegex: '(/(__tests__|e2e)/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?|mts)$',
  transform: {
    '^.+\\.(ts|mts|tsx|js|mjs)?$': 'babel-jest',
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@octokit|before-after-hook|universal-user-agent|bottleneck|@octokit/core|@octokit/plugin-retry|@octokit/plugin-rest-endpoint-methods|@octokit/plugin-throttling|chalk)/)', // Ensure these node_modules are transformed
  ],
};
