// Import jest-dom additions
import '@testing-library/jest-dom';

// Mock global fetch if needed
window.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
window.localStorage = localStorageMock;

// Mock TextEncoder/TextDecoder
class TextEncoderMock {
  encode(str) {
    return new Uint8Array([...str].map(c => c.charCodeAt(0)));
  }
}

class TextDecoderMock {
  decode(arr) {
    return String.fromCharCode(...arr);
  }
}

global.TextEncoder = TextEncoderMock;
global.TextDecoder = TextDecoderMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
