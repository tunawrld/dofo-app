import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';
import { useUserStore } from './userStore';
import { syncStateFromCloud, syncStateToCloud } from './supabaseSync';

let isRehydrating = false;

export const setRehydrating = (val: boolean) => {
    isRehydrating = val;
};

export const scopedStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const userId = useUserStore.getState().userId || 'default';
        const key = userId === 'default' ? name : `${name}_${userId}`;
        
        // 1. Bulut senkronizasyonu (Cloud Sync): Eğer online ise ve cloud'da daha güncel / farklı bir veri varsa getirir.
        if (userId !== 'default') {
            const cloudVal = await syncStateFromCloud(userId, name);
            if (cloudVal) {
                // Cloud verisini lokale kaydet ve döndür
                await AsyncStorage.setItem(key, cloudVal);
                return cloudVal;
            }
        }
        
        // 2. Offline ya da bulutta yoksa yerel veriye bak.
        const val = await AsyncStorage.getItem(key);
        if (val) return val;
        
        // 3. One-time fallback for user data that was previously saved globally without a custom userId suffix
        if (userId !== 'default') {
            const oldVal = await AsyncStorage.getItem(name);
            if (oldVal) {
                await AsyncStorage.setItem(key, oldVal);
                // Eski anonim veriyi sadece giriş yapan İLK kullanıcı alır, diğerlerine klonlanmaz:
                await AsyncStorage.removeItem(name); 
                // Bunu cloud'a da yedekleyelim:
                syncStateToCloud(userId, name, oldVal);
                return oldVal;
            }
        }
        return null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (isRehydrating) return;
        const userId = useUserStore.getState().userId || 'default';
        const key = userId === 'default' ? name : `${name}_${userId}`;
        
        await AsyncStorage.setItem(key, value);
        
        // Arka planda eşzamanlı olarak Cloud'a post et:
        if (userId !== 'default') {
            syncStateToCloud(userId, name, value);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        const userId = useUserStore.getState().userId || 'default';
        const key = userId === 'default' ? name : `${name}_${userId}`;
        await AsyncStorage.removeItem(key);
    },
};
