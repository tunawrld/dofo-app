import { scopedStorage } from './scopedStorage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PermanentNotesState {
    note: string;
    setNote: (text: string) => void;
}

export const useNotesStore = create<PermanentNotesState>()(
    persist(
        (set) => ({
            note: '',
            setNote: (text) => set({ note: text }),
        }),
        {
            name: 'unutma-permanent-notes',
            storage: createJSONStorage(() => scopedStorage),
            merge: (persistedState: any, currentState: any) => {
                if (!persistedState) return { ...currentState, note: '' };
                return { ...currentState, ...persistedState };
            }
        }
    )
);
