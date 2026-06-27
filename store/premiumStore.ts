import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { scopedStorage } from './scopedStorage';

interface PremiumState {
    isPremium: boolean;
    setPremium: (value: boolean) => void;
}

export const usePremiumStore = create<PremiumState>()(
    persist(
        (set) => ({
            isPremium: false,
            setPremium: (value) => set({ isPremium: value }),
        }),
        {
            name: 'premium-storage-v2',
            storage: createJSONStorage(() => scopedStorage),
        }
    )
);
