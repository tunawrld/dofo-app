import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/lib/i18n';
import { useLanguageStore } from '@/store/languageStore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const PROFILE_KEY = 'dofo_local_profile';

export default function ProfileScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const { t } = useTranslation();
    const language = useLanguageStore((state) => state.language);
    const setLanguage = useLanguageStore((state) => state.setLanguage);

    const [displayName, setDisplayName] = useState('');
    const [savedName, setSavedName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        loadLocalProfile();
    }, []);

    const loadLocalProfile = async () => {
        try {
            const raw = await AsyncStorage.getItem(PROFILE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                const name = data.full_name || '';
                setDisplayName(name);
                setSavedName(name);
            }
        } catch (e) {
            // ignore
        }
    };

    const handlePencilPress = useCallback(() => {
        setIsEditing(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    const handleSave = useCallback(async () => {
        const trimmed = displayName.trim();
        try {
            await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ full_name: trimmed }));
            setSavedName(trimmed);
            setIsEditing(false);
            Keyboard.dismiss();
        } catch (e) {
            console.error('Profile save error:', e);
        }
    }, [displayName, t]);

    const handleCancel = useCallback(() => {
        setDisplayName(savedName);
        setIsEditing(false);
        Keyboard.dismiss();
    }, [savedName]);

    const styles = makeStyles(colors);

    const displayInitial = (savedName || t('profile.default_username') || 'D')[0].toUpperCase();

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.backgroundDark }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.textLight} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('profile.title')}</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Avatar + İsim Alanı */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{displayInitial}</Text>
                        </View>
                        <View style={styles.onlineDot} />
                    </View>

                    {isEditing ? (
                        <View style={styles.nameInputWrapper}>
                            <View style={[styles.nameInputBox, { borderColor: colors.primary + '70', backgroundColor: colors.primary + '0D' }]}>
                                <TextInput
                                    ref={inputRef}
                                    style={[styles.nameInput, { color: colors.textLight }]}
                                    value={displayName}
                                    onChangeText={(text) => setDisplayName(text.slice(0, 30))}
                                    placeholder="İsim gir..."
                                    placeholderTextColor={colors.textMuted}
                                    onSubmitEditing={handleSave}
                                    returnKeyType="done"
                                    autoCapitalize="words"
                                    textAlign="center"
                                    maxLength={30}
                                    numberOfLines={1}
                                    scrollEnabled={false}
                                />
                            </View>
                            <View style={styles.editActions}>
                                <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.textMuted + '40' }]} onPress={handleCancel}>
                                    <Text style={[styles.actionBtnText, { color: colors.textMuted }]}>{t('profile.cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={handleSave}>
                                    <Text style={[styles.actionBtnText, { color: '#fff' }]}>{t('profile.save')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.nameRow} onPress={handlePencilPress} activeOpacity={0.7}>
                            <Text
                                style={styles.displayName}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {savedName || t('profile.default_username')}
                            </Text>
                            <View style={[styles.editBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                                <Ionicons name="create-outline" size={14} color={colors.primary} />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Dil Seçici */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
                    <View style={styles.languageRow}>
                        {['en', 'tr', 'es', 'de', 'fr'].map((lang) => (
                            <TouchableOpacity
                                key={lang}
                                onPress={() => setLanguage(lang)}
                                style={[
                                    styles.langButton,
                                    {
                                        backgroundColor: language === lang ? colors.primary : colors.inputBg,
                                        borderColor: language === lang ? colors.primary : colors.textMuted + '30',
                                    }
                                ]}
                            >
                                <Text style={{
                                    color: language === lang ? '#fff' : colors.textLight,
                                    fontSize: 14,
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                }}>
                                    {lang}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ height: 40 }} />
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const makeStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
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
            paddingVertical: 32,
        },
        avatarContainer: {
            position: 'relative',
            marginBottom: 20,
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
        nameRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            maxWidth: '85%',
            overflow: 'hidden',
        },
        editBadge: {
            width: 26,
            height: 26,
            borderRadius: 8,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        displayName: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.textLight,
            textAlign: 'center',
            flexShrink: 1,
        },
        nameInputWrapper: {
            width: '82%',
            alignItems: 'center',
            gap: 14,
        },
        nameInputBox: {
            width: '100%',
            borderRadius: 16,
            borderWidth: 1.5,
            paddingVertical: 14,
            paddingHorizontal: 20,
            overflow: 'hidden',
        },
        nameInput: {
            width: '100%',
            fontSize: 20,
            fontWeight: '700',
        },
        editActions: {
            flexDirection: 'row',
            gap: 10,
            marginTop: 0,
        },
        actionBtn: {
            paddingVertical: 8,
            paddingHorizontal: 24,
            borderRadius: 12,
            borderWidth: 1,
        },
        actionBtnText: {
            fontSize: 15,
            fontWeight: '600',
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
            marginBottom: 14,
        },
        languageRow: {
            flexDirection: 'row',
            gap: 8,
            flexWrap: 'wrap',
        },
        langButton: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
        },
    });
