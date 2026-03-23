import { useTaskStore } from './taskStore';
import { useNotesStore } from './notesStore';
import { useMoodStore } from './moodStore';
import { useStreakStore } from './streakStore';
import { setRehydrating } from './scopedStorage';
import { useUserStore } from './userStore';

export const rehydrateAllStores = async () => {
    useUserStore.getState().setIsSyncing(true);

    // 1. Temporarily pause storage writes. This prevents the following memory wipe 
    // from triggering a Zustand save effect that writes empty states to the NEW user's file.
    setRehydrating(true);

    // 2. Wipe memory completely. This prevents the new user from inheriting the previous user's data 
    // in case the new user has no data (Zustand doesn't merge null from storage, so memory wouldn't naturally clear).
    useTaskStore.setState({ tasks: [], lastDeletedTask: null });
    useNotesStore.setState({ note: '' });
    useMoodStore.setState({ moods: [] });
    useStreakStore.setState({ streakData: { currentStreak: 0, longestStreak: 0, lastCompletionDate: '' } });

    // 3. Rehydrate from storage. This fetches the correct user's data according to userStore, 
    // and correctly merges it with the completely clean memory state from step 2.
    await Promise.all([
        useTaskStore.persist.rehydrate(),
        useNotesStore.persist.rehydrate(),
        useMoodStore.persist.rehydrate(),
        useStreakStore.persist.rehydrate()
    ]);

    // 4. Important: Re-enable storage saves so the user can immediately save data!
    setRehydrating(false);
    
    useUserStore.getState().setIsSyncing(false);
};
