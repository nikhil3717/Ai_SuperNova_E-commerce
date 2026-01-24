// Disable console logs during tests for performance improvement
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => { });
  jest.spyOn(console, "error").mockImplementation(() => { });
});
