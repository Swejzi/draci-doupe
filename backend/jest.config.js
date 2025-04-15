module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 50,
      functions: 50,
      lines: 50
    }
  },
  verbose: true,
  // Nastavení pro ukončení testů
  forceExit: true,
  // Timeout pro testy
  testTimeout: 10000,
  // Setup file to run before tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
