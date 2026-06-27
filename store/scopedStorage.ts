import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

// Pure local storage — no cloud sync, no user scoping
export const scopedStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return await AsyncStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await AsyncStorage.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await AsyncStorage.removeItem(name);
    },
};
