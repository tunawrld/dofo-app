import { createAuthenticatedClient } from '../lib/supabase';

let getClerkToken: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (fn: () => Promise<string | null>) => {
    getClerkToken = fn;
};

export const getSupabaseToken = async () => {
    if (getClerkToken) {
        return await getClerkToken();
    }
    return null;
};

export const syncStateToCloud = async (userId: string, key: string, value: string) => {
    try {
        const token = await getSupabaseToken();
        if (!token) return;
        const supabase = createAuthenticatedClient(token);
        await supabase.from('user_states').upsert({
            user_id: userId,
            key: key,
            value: value,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, key' });
    } catch (e) {
        // Sessiz hata (Cloud çalışmasa bile lokal devam etsin)
        console.warn('Supabase sync error:', e);
    }
}

export const syncStateFromCloud = async (userId: string, key: string): Promise<string | null> => {
    try {
        const token = await getSupabaseToken();
        if (!token) return null;
        const supabase = createAuthenticatedClient(token);
        const { data, error } = await supabase.from('user_states')
            .select('value')
            .eq('user_id', userId)
            .eq('key', key)
            .single();

        if (error || !data) return null;
        return data.value;
    } catch (e) {
        return null;
    }
}
