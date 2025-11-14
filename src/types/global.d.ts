declare global {
  interface Window {
    smartsupp?: (...args: unknown[]) => void
  }
}

export {}
