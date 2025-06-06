module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testEnvironmentOptions: {
    experimentalVmModules: true,
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true
      // Removed inline tsconfig override to use main tsconfig.json
    }],
    '^.+\\.(js|jsx)$': 'babel-jest', // Added for completeness, may not be strictly necessary if no JS files
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: ['/node_modules/'],
  // globals section for ts-jest removed
  moduleNameMapper: {
    // Mock CSS imports (if any)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/tests/integration.spec.ts',
  ],
};
