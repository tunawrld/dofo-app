import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/lib/i18n';
import { useLanguageStore } from '@/store/languageStore';
import { getProfile, Profile, upsertProfile } from '@/lib/supabase';
import { useAuth, useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProfileScreen() {
    const { user } = useUser();
    const { signOut, getToken } = useAuth();
    const router = useRouter();
    const colors = useThemeColors();
    const { t } = useTranslation();
    const language = useLanguageStore((state) => state.language);
    const setLanguage = useLanguageStore((state) => state.setLanguage);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);  // false olarak baslatildi
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadProfile();
        }
    }, [user?.id]);

    const loadProfile = async () => {
        if (!user) return;

        // Eger onceden yuklenmis (ya da cached) profil yoksa ekranda sadece ufak bir spinner veya eski data donar/kalir
        // Ekleyecegimiz isLoading arka planda kullanacak.
        setLoading(true);
        try {
            // Çevrimdışı senaryosu için önce Local Storage'dan (Önbellek) yüklemeyi dene
            const cachedProfileString = await AsyncStorage.getItem(`profile_${user.id}`);
            if (cachedProfileString) {
                const cachedProfile = JSON.parse(cachedProfileString);
                setProfile(cachedProfile);
                setFullName(cachedProfile.full_name || '');
            }

            // İnternet varsa veriyi güncelle (senkronize et)
            const token = await getToken({ template: 'supabase' });
            if (!token) throw new Error('Could not get Clerk token for Supabase');

            let existingProfile = await getProfile(token, user.id);

            if (!existingProfile) {
                // İlk giriş: profil oluştur
                existingProfile = await upsertProfile(token, {
                    id: user.id,
                    email: user.emailAddresses[0]?.emailAddress || null,
                    full_name: user.fullName || user.firstName || null,
                    avatar_url: user.imageUrl || null,
                });
            }

            if (existingProfile) {
                setProfile(existingProfile);
                setFullName(existingProfile.full_name || '');
                // İnternetten çekilen en güncel veriyi Local Storage'a kaydet (internetsiz anlar için)
                await AsyncStorage.setItem(`profile_${user.id}`, JSON.stringify(existingProfile));
            }
        } catch (error: any) {
            console.warn('Network / Offline hatası yakalandı. Local veriler kullanılmaya devam ediliyor:', error.message || error);
            // Zaten local storage'dan veri çekebildiysek sorun yok, ama çekemediysek clerk verilerini göster
            if (!profile) {
                setFullName(user.fullName || user.firstName || '');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = useCallback(async () => {
        if (!user) return;
        setSaving(true);
        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) throw new Error('Could not get Clerk token for Supabase');

            const updated = await upsertProfile(token, {
                id: user.id,
                full_name: fullName.trim() || null,
            });

            if (updated) {
                setProfile(updated);
                setEditing(false);
                Alert.alert(t('profile.success'), t('profile.update_success'));
            } else {
                Alert.alert(t('profile.error'), t('profile.update_error'));
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert(t('profile.error'), t('profile.update_error'));
        } finally {
            setSaving(false);
        }
    }, [user, fullName]);

    const handleSignOut = useCallback(async () => {
        Alert.alert(
            t('profile.signout_confirm_title'),
            t('profile.signout_confirm_msg'),
            [
                { text: t('profile.cancel'), style: 'cancel' },
                {
                    text: t('profile.signout'),
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/sign-in');
                    },
                },
            ]
        );
    }, [signOut, router, t]);

    const styles = makeStyles(colors);



    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.textLight} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('profile.title')}</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Avatar Section */}
            <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {(fullName || user?.fullName || user?.firstName || user?.emailAddresses[0]?.emailAddress || '?')[0].toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.onlineDot} />
                </View>
                <Text style={styles.displayName}>
                    {fullName || user?.fullName || user?.firstName || t('profile.default_username')}
                </Text>
                <Text style={styles.emailText}>
                    {user?.emailAddresses[0]?.emailAddress || ''}
                </Text>
            </View>

            {/* Profile Form */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('profile.info')}</Text>

                <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>{t('profile.name')}</Text>
                    {editing ? (
                        <View style={styles.editInputContainer}>
                            <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.editInput}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder={t('profile.name')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    ) : (
                        <View style={styles.fieldValueContainer}>
                            <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                            <Text style={styles.fieldValue}>{fullName || user?.fullName || user?.firstName || '-'}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>{t('profile.email')}</Text>
                    <View style={styles.fieldValueContainer}>
                        <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                        <Text style={styles.fieldValueDisabled}>
                            {user?.emailAddresses[0]?.emailAddress || '-'}
                        </Text>
                    </View>
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>{t('profile.language')}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                        {['en', 'tr', 'es', 'de', 'fr'].map((lang) => (
                            <TouchableOpacity
                                key={lang}
                                onPress={() => setLanguage(lang)}
                                style={{
                                    paddingVertical: 6,
                                    paddingHorizontal: 12,
                                    borderRadius: 12,
                                    backgroundColor: language === lang ? colors.primary : colors.inputBg,
                                    borderWidth: 1,
                                    borderColor: language === lang ? colors.primary : colors.textMuted + '30',
                                }}
                            >
                                <Text style={{
                                    color: language === lang ? '#fff' : colors.textLight,
                                    fontSize: 14,
                                    fontWeight: '600',
                                    textTransform: 'uppercase'
                                }}>
                                    {lang}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {editing ? (
                    <View style={styles.editButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setEditing(false);
                                setFullName(profile?.full_name || '');
                            }}
                        >
                            <Text style={styles.cancelButtonText}>{t('profile.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.saveButtonText}>{t('profile.save')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setEditing(true)}
                    >
                        <Ionicons name="create-outline" size={18} color={colors.primary} />
                        <Text style={styles.editButtonText}>{t('profile.edit')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Sign Out */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color={colors.red} />
                <Text style={styles.signOutText}>{t('profile.signout')}</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const makeStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.backgroundDark,
        },
        centered: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        content: {
            paddingBottom: 20,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 60,
            paddingBottom: 16,
        },
        backButton: {
            padding: 4,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.textLight,
        },
        avatarSection: {
            alignItems: 'center',
            paddingVertical: 24,
        },
        avatarContainer: {
            position: 'relative',
            marginBottom: 16,
        },
        avatar: {
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: colors.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: colors.primary,
        },
        avatarText: {
            fontSize: 36,
            fontWeight: '700',
            color: colors.primary,
        },
        onlineDot: {
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.primary,
            position: 'absolute',
            bottom: 2,
            right: 2,
            borderWidth: 3,
            borderColor: colors.backgroundDark,
        },
        displayName: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.textLight,
            marginBottom: 4,
        },
        emailText: {
            fontSize: 14,
            color: colors.textMuted,
        },
        section: {
            marginHorizontal: 20,
            marginTop: 8,
            backgroundColor: colors.cardBg,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.textMuted + '15',
        },
        sectionTitle: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 16,
        },
        fieldContainer: {
            marginBottom: 16,
        },
        fieldLabel: {
            fontSize: 13,
            color: colors.textMuted,
            marginBottom: 6,
        },
        fieldValueContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 10,
            paddingHorizontal: 14,
            backgroundColor: colors.inputBg,
            borderRadius: 10,
        },
        fieldValue: {
            fontSize: 16,
            color: colors.textLight,
        },
        fieldValueDisabled: {
            fontSize: 16,
            color: colors.textMuted,
        },
        editInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 14,
            backgroundColor: colors.inputBg,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.primary + '50',
        },
        editInput: {
            flex: 1,
            fontSize: 16,
            color: colors.textLight,
            paddingVertical: 10,
        },
        editButtons: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 4,
        },
        cancelButton: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.textMuted + '40',
        },
        cancelButtonText: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.textMuted,
        },
        saveButton: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
            backgroundColor: colors.primary,
        },
        saveButtonDisabled: {
            opacity: 0.6,
        },
        saveButtonText: {
            fontSize: 15,
            fontWeight: '600',
            color: '#fff',
        },
        editButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 10,
            marginTop: 4,
        },
        editButtonText: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.primary,
        },
        signOutButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginHorizontal: 20,
            marginTop: 24,
            paddingVertical: 16,
            borderRadius: 14,
            backgroundColor: colors.red + '10',
            borderWidth: 1,
            borderColor: colors.red + '30',
        },
        signOutText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.red,
        },
    });
