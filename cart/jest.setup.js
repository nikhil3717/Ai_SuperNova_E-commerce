beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  if (console.error.mockRestore) {
    console.error.mockRestore();
  }
  if (console.warn.mockRestore) {
    console.warn.mockRestore();
  }
});
