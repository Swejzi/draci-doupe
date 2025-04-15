// Suppress console logs during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();

  // Set environment variables for tests
  process.env.JWT_SECRET = 'test-secret-key';
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock database connection
jest.mock('./config/db', () => {
  return {
    query: jest.fn().mockImplementation((text, params, callback) => {
      if (callback) {
        callback(null, { rows: [] });
      }
      return Promise.resolve({ rows: [] });
    }),
    pool: {
      connect: jest.fn().mockImplementation((callback) => {
        if (callback) {
          callback(null, {
            query: jest.fn().mockResolvedValue({ rows: [] }),
            release: jest.fn()
          });
        }
        return Promise.resolve({
          query: jest.fn().mockResolvedValue({ rows: [] }),
          release: jest.fn()
        });
      })
    }
  };
});

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-token'),
  verify: jest.fn().mockReturnValue({ userId: 1, username: 'testuser' })
}));
