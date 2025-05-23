module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/integration/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/testSetup.js'],
  testTimeout: 60000, // Increased timeout
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  detectOpenHandles: true // Add this to help detect hanging connections
};
