module.exports = {
  testEnvironment: "node",

  // Where tests live
  testMatch: ["**/__tests__/**/*.test.js"],

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Setup file (runs before every test file)
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Prevent open handles issues
  forceExit: true,

  // Improve stack traces
  verbose: true,

  // Ignore build / node_modules
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  // Timeout (DB / async safe)
  testTimeout: 15000,
};
