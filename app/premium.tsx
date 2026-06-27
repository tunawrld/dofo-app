import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/lib/i18n';
import { usePremiumStore } from '@/store/premiumStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// App Store & Play Store subscription management URLs
const MANAGE_SUBSCRIPTION_URL = Platform.select({
    ios: 'https://apps.apple.com/account/subscriptions',
    android: 'https://play.google.com/store/account/subscriptions',
    default: 'https://apps.apple.com/account/subscriptions',
});

// Only the 2 real features
const FEATURES = [
    { icon: 'infinite-outline' as const, key: 'feature_unlimited' },
    { icon: 'notifications-outline' as const, key: 'feature_reminders' },
];

export default function PremiumScreen() {
    const C = useThemeColors();
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isPremium = usePremiumStore((state) => state.isPremium);
    const setPremium = usePremiumStore((state) => state.setPremium);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
    const [loading, setLoading] = useState(false);

    // ─── Purchase (replace with real IAP in production) ───────────────────────
    const handlePurchase = async () => {
        if (isPremium) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setPremium(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('🎉', t('premium.already_premium'), [
                { text: 'OK', onPress: () => router.back() },
            ]);
        }, 1500);
    };

    // ─── Restore (Apple requirement: must be present) ──────────────────────────
    const handleRestore = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // In production: call IAP restore method here
        Alert.alert(t('premium.restore'), t('premium.restore_not_found'), [{ text: 'OK' }]);
    };

    // ─── Manage / Cancel subscription ─────────────────────────────────────────
    // Apple: must open Settings > Subscriptions (or App Store subscriptions page)
    // Google: must open Play Store subscriptions page
    const handleManageSubscription = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const supported = await Linking.canOpenURL(MANAGE_SUBSCRIPTION_URL!);
            if (supported) {
                await Linking.openURL(MANAGE_SUBSCRIPTION_URL!);
            } else {
                Alert.alert(t('premium.manage_sub'), t('premium.manage_sub_hint'));
            }
        } catch {
            Alert.alert(t('premium.manage_sub'), t('premium.manage_sub_hint'));
        }
    };

    const price = selectedPlan === 'yearly' ? t('premium.price_yearly') : t('premium.price');
    const priceNote = selectedPlan === 'yearly' ? t('premium.legal_yearly') : t('premium.legal_monthly');

    return (
        <View style={[styles.container, { backgroundColor: C.backgroundDark }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={12}
                    style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
                >
                    <Ionicons name="chevron-back" size={28} color={C.textLight} />
                </Pressable>

                {isPremium && (
                    <View style={[styles.premiumBadge, { backgroundColor: C.primary + '20', borderColor: C.primary + '40' }]}>
                        <Ionicons name="star" size={12} color={C.primary} />
                        <Text style={[styles.premiumBadgeText, { color: C.primary }]}>{t('premium.premium_badge')}</Text>
                    </View>
                )}
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero ── */}
                <View style={styles.heroSection}>
                    <LinearGradient
                        colors={[C.primary + '28', C.primary + '06', 'transparent']}
                        style={styles.heroBg}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                    />
                    <View style={[styles.crownContainer, { backgroundColor: C.primary + '15', borderColor: C.primary + '25' }]}>
                        <Ionicons name="star-outline" size={36} color={C.primary} />
                    </View>
                    <Text style={[styles.heroTitle, { color: C.textLight }]}>{t('premium.title')}</Text>
                    <Text style={[styles.heroSubtitle, { color: C.textMuted }]}>{t('premium.subtitle')}</Text>
                </View>

                {/* ── Features (only 2) ── */}
                <View style={[styles.featuresCard, { backgroundColor: C.cardBg, borderColor: C.border + '15' }]}>
                    {FEATURES.map((feature, index) => (
                        <View key={feature.key}>
                            <View style={styles.featureRow}>
                                <View style={[styles.featureIconBg, { backgroundColor: C.primary + '15' }]}>
                                    <Ionicons name={feature.icon} size={22} color={C.primary} />
                                </View>
                                <Text style={[styles.featureText, { color: C.textLight }]}>
                                    {t(`premium.${feature.key}`)}
                                </Text>
                                <Ionicons name="checkmark-circle" size={22} color={C.primary} />
                            </View>
                            {index < FEATURES.length - 1 && (
                                <View style={[styles.featureDivider, { backgroundColor: C.border + '10' }]} />
                            )}
                        </View>
                    ))}
                </View>

                {/* ── Free user: Plan selector + CTA ── */}
                {!isPremium && (
                    <>
                        {/* Plan pills */}
                        <View style={styles.planRow}>
                            {/* Monthly */}
                            <Pressable
                                onPress={() => { setSelectedPlan('monthly'); Haptics.selectionAsync(); }}
                                style={[
                                    styles.planCard,
                                    {
                                        backgroundColor: selectedPlan === 'monthly' ? C.primary + '20' : C.cardBg,
                                        borderColor: selectedPlan === 'monthly' ? C.primary : C.border + '20',
                                        borderWidth: selectedPlan === 'monthly' ? 2 : 1,
                                    }
                                ]}
                            >
                                <Text style={[styles.planLabel, { color: selectedPlan === 'monthly' ? C.primary : C.textMuted }]}>
                                    {t('premium.monthly')}
                                </Text>
                                <Text style={[styles.planPrice, { color: selectedPlan === 'monthly' ? C.primary : C.textLight }]}>
                                    {t('premium.price')}
                                </Text>
                            </Pressable>

                            {/* Yearly */}
                            <Pressable
                                onPress={() => { setSelectedPlan('yearly'); Haptics.selectionAsync(); }}
                                style={[
                                    styles.planCard,
                                    {
                                        backgroundColor: selectedPlan === 'yearly' ? C.primary + '20' : C.cardBg,
                                        borderColor: selectedPlan === 'yearly' ? C.primary : C.border + '20',
                                        borderWidth: selectedPlan === 'yearly' ? 2 : 1,
                                    }
                                ]}
                            >
                                <View style={[styles.saveBadge, { backgroundColor: C.primary }]}>
                                    <Text style={styles.saveBadgeText}>{t('premium.save_badge')}</Text>
                                </View>
                                <Text style={[styles.planLabel, { color: selectedPlan === 'yearly' ? C.primary : C.textMuted }]}>
                                    {t('premium.yearly')}
                                </Text>
                                <Text style={[styles.planPrice, { color: selectedPlan === 'yearly' ? C.primary : C.textLight }]}>
                                    {t('premium.price_yearly')}
                                </Text>
                            </Pressable>
                        </View>

                        {/* CTA */}
                        <Pressable
                            onPress={handlePurchase}
                            disabled={loading}
                            style={({ pressed }) => [styles.ctaButton, { opacity: pressed || loading ? 0.8 : 1 }]}
                        >
                            <LinearGradient
                                colors={[C.primary, C.primary + 'BB']}
                                style={styles.ctaGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.ctaButtonText}>
                                    {loading ? '...' : t('premium.get_premium')}
                                </Text>
                            </LinearGradient>
                        </Pressable>

                        {/* Restore — Apple requires this */}
                        <Pressable onPress={handleRestore} style={styles.secondaryBtn}>
                            <Text style={[styles.secondaryBtnText, { color: C.textMuted }]}>
                                {t('premium.restore')}
                            </Text>
                        </Pressable>

                        {/* Legal disclosure — required by Apple & Google */}
                        <View style={[styles.legalBox, { backgroundColor: C.cardBg, borderColor: C.border + '12' }]}>
                            <Text style={[styles.legalText, { color: C.textMuted }]}>
                                {priceNote}
                            </Text>
                            <Text style={[styles.legalText, { color: C.textMuted, marginTop: 6 }]}>
                                {t('premium.legal_cancel')}
                            </Text>
                            <View style={styles.legalLinks}>
                                <Pressable onPress={() => Linking.openURL('https://example.com/privacy')}>
                                    <Text style={[styles.legalLink, { color: C.primary }]}>{t('premium.privacy')}</Text>
                                </Pressable>
                                <Text style={[styles.legalDot, { color: C.textMuted }]}>·</Text>
                                <Pressable onPress={() => Linking.openURL('https://example.com/terms')}>
                                    <Text style={[styles.legalLink, { color: C.primary }]}>{t('premium.terms')}</Text>
                                </Pressable>
                            </View>
                        </View>
                    </>
                )}

                {/* ── Premium user: status + manage sub button ── */}
                {isPremium && (
                    <>
                        <View style={[styles.alreadyPremiumBox, { backgroundColor: C.primary + '12', borderColor: C.primary + '25' }]}>
                            <Text style={[styles.alreadyPremiumText, { color: C.primary }]}>
                                {t('premium.already_premium')}
                            </Text>
                            <Text style={[styles.alreadyPremiumSub, { color: C.textMuted }]}>
                                {t('premium.manage_sub_hint')}
                            </Text>
                        </View>

                        {/* Manage / Cancel — required by Apple & Google */}
                        <Pressable
                            onPress={handleManageSubscription}
                            style={({ pressed }) => [
                                styles.manageSubButton,
                                {
                                    backgroundColor: pressed ? C.border + '12' : C.cardBg,
                                    borderColor: C.border + '20',
                                }
                            ]}
                        >
                            <Ionicons name="settings-outline" size={18} color={C.textMuted} />
                            <Text style={[styles.manageSubText, { color: C.textLight }]}>
                                {t('premium.manage_sub')}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                        </Pressable>

                        <Text style={[styles.manageSubHint, { color: C.textMuted }]}>
                            {Platform.OS === 'ios'
                                ? t('premium.cancel_ios')
                                : t('premium.cancel_android')}
                        </Text>

                        {/* Restore button for premium users too */}
                        <Pressable onPress={handleRestore} style={[styles.secondaryBtn, { marginTop: 8 }]}>
                            <Text style={[styles.secondaryBtnText, { color: C.textMuted }]}>
                                {t('premium.restore')}
                            </Text>
                        </Pressable>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    backButton: { padding: 4 },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    premiumBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 32,
        position: 'relative',
        overflow: 'hidden',
    },
    heroBg: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
    },
    crownContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        marginBottom: 16,
    },

    heroTitle: {
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -1,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 15,
        fontWeight: '400',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    featuresCard: {
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 8,
        marginBottom: 24,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 14,
    },
    featureIconBg: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 21,
    },
    featureDivider: {
        height: 1,
        marginLeft: 56,
    },
    planRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    planCard: {
        flex: 1,
        borderRadius: 18,
        padding: 16,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 88,
        justifyContent: 'center',
    },
    planLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    planPrice: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    saveBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 7,
    },
    saveBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
    },
    ctaButton: {
        borderRadius: 28,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    ctaButtonText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.3,
    },
    secondaryBtn: {
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 8,
    },
    secondaryBtnText: {
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    legalBox: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 16,
        marginTop: 4,
        gap: 0,
    },
    legalText: {
        fontSize: 11,
        lineHeight: 16,
        textAlign: 'center',
    },
    legalLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
    },
    legalLink: {
        fontSize: 12,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    legalDot: {
        fontSize: 14,
    },
    alreadyPremiumBox: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 28,
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    alreadyPremiumEmoji: { fontSize: 40, marginBottom: 4 },
    alreadyPremiumText: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
    },
    alreadyPremiumSub: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 4,
    },
    manageSubButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
    },
    manageSubText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    manageSubHint: {
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: 16,
        marginBottom: 4,
    },
});
