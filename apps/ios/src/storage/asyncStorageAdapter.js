import AsyncStorage from "@react-native-async-storage/async-storage";

export const asyncStorageAdapter = {
  async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value != null ? { value } : null;
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
};
