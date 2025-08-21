// Utilities to safely access Web Storage APIs without throwing in restricted environments

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const createInMemoryStorage = (): StorageLike => {
  const memoryStore = new Map<string, string>();
  return {
    getItem: (key: string) => (memoryStore.has(key) ? memoryStore.get(key)! : null),
    setItem: (key: string, value: string) => {
      memoryStore.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStore.delete(key);
    },
  };
};

const isStorageOperational = (storage: Storage | undefined): boolean => {
  if (!storage) return false;
  try {
    const testKey = "__storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

export const safeLocalStorage: StorageLike = (() => {
  if (typeof window !== "undefined" && isStorageOperational(window.localStorage)) {
    return window.localStorage;
  }
  return createInMemoryStorage();
})();

export const safeSessionStorage: StorageLike = (() => {
  if (typeof window !== "undefined" && isStorageOperational(window.sessionStorage)) {
    return window.sessionStorage;
  }
  return createInMemoryStorage();
})();

