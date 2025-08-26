import '@testing-library/jest-dom';

// Add global type declarations for testing
declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T> {}
  }
}