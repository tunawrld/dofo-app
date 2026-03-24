import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WelcomeScreenProps {
    onStart: () => void;
}


export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
    const C = useThemeColors();
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);

    const SLIDES = [
        {
            icon: 'timer-outline' as const,
            title: t('welcome.slide1_title'),
            subtitle: t('welcome.slide1_subtitle'),
        },
        {
            icon: 'trending-down-outline' as const,
            title: t('welcome.slide2_title'),
            subtitle: t('welcome.slide2_subtitle'),
        },
        {
            icon: 'barbell-outline' as const,
            title: t('welcome.slide3_title'),
            subtitle: t('welcome.slide3_subtitle'),
        },
        {
            icon: 'skull-outline' as const,
            title: t('welcome.slide4_title'),
            subtitle: t('welcome.slide4_subtitle'),
        }
    ];

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const scrollX = useRef(new Animated.Value(0)).current;

    const flatListRef = useRef<Animated.FlatList>(null);

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }).current;

    const animateIn = () => {
        fadeAnim.setValue(0);
        slideAnim.setValue(40);
        scaleAnim.setValue(0.95);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),
        ]).start();
    };

    useEffect(() => {
        animateIn();
    }, []);

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            handleStart();
        }
    };

    const handleGiveUp = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
            t('welcome.coward_title'),
            t('welcome.coward_msg'),
            [{ text: t('welcome.coward_button'), onPress: () => { } }]
        );
    };

    const handleStart = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => onStart());
    };

    const renderItem = ({ item }: { item: { icon: any, title: string, subtitle: string } }) => {
        return (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
                <View style={[styles.iconContainer, { backgroundColor: C.primary + '15', borderColor: C.primary + '30' }]}>
                    <Ionicons name={item.icon} size={64} color={C.primary} />
                </View>
                <Text style={[styles.title, { color: C.textLight }]}>{item.title}</Text>
                <Text style={[styles.subtitle, { color: C.textMuted }]}>{item.subtitle}</Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: C.backgroundDark }]}>
            <Animated.View
                style={[
                    styles.contentWrapper,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                    }
                ]}
            >
                {/* Horizontal Swipeable Content */}
                <View style={styles.sliderContainer}>
                    <Animated.FlatList
                        ref={flatListRef}
                        data={SLIDES}
                        keyExtractor={(item) => item.title}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        bounces={false}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: false } // Required for width/color interpolation
                        )}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        renderItem={renderItem}
                    />
                </View>

                {/* Static Bottom Elements */}
                <View style={styles.bottomContainer}>
                    <View style={styles.dotsContainer}>
                        {SLIDES.map((_, index) => {
                            const inputRange = [
                                (index - 1) * SCREEN_WIDTH,
                                index * SCREEN_WIDTH,
                                (index + 1) * SCREEN_WIDTH
                            ];

                            const dotWidth = scrollX.interpolate({
                                inputRange,
                                outputRange: [10, 24, 10],
                                extrapolate: 'clamp',
                            });

                            const backgroundColor = scrollX.interpolate({
                                inputRange,
                                outputRange: ['#444444', C.primary, '#444444'],
                                extrapolate: 'clamp',
                            });

                            return (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        { width: dotWidth, backgroundColor }
                                    ]}
                                />
                            );
                        })}
                    </View>

                    <View style={styles.buttonWrapper}>
                        {currentIndex < SLIDES.length - 1 ? (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.button,
                                    { backgroundColor: C.primary, opacity: pressed ? 0.8 : 1 }
                                ]}
                                onPress={handleNext}
                            >
                                <Text style={[styles.buttonText, { color: C.backgroundDark }]}>{t('welcome.continue')}</Text>
                                <Ionicons name="chevron-forward" size={24} color={C.backgroundDark} />
                            </Pressable>
                        ) : (
                            <View style={{ gap: 16 }}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.button,
                                        { backgroundColor: C.primary, shadowColor: C.primary, opacity: pressed ? 0.8 : 1 }
                                    ]}
                                    onPress={handleStart}
                                >
                                    <Text style={[styles.buttonText, { color: C.backgroundDark }]}>{t('welcome.promise')}</Text>
                                    <Ionicons name="flame" size={24} color={C.backgroundDark} />
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.outlineButton,
                                        { borderColor: '#e53935', backgroundColor: pressed ? 'rgba(229, 57, 53, 0.1)' : 'transparent' }
                                    ]}
                                    onPress={handleGiveUp}
                                >
                                    <Text style={[styles.outlineButtonText, { color: '#e53935' }]}>{t('welcome.give_up')}</Text>
                                    <Ionicons name="close" size={24} color={'#e53935'} />
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>

            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: 'center',
    },
    contentWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sliderContainer: {
        height: 380, // Fixed height specifically for the swiping part (icon + text)
        marginTop: 40,
    },
    slide: {
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        borderWidth: 1.5,
    },
    title: {
        fontSize: 35,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 44,
        letterSpacing: -1,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 28,
        fontWeight: '500',
    },
    bottomContainer: {
        width: '100%',
        paddingHorizontal: 32,
        alignItems: 'center',
        marginTop: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        height: 10,
        alignItems: 'center',
        marginBottom: 32,
    },
    dot: {
        height: 10,
        borderRadius: 5,
    },
    buttonWrapper: {
        width: '100%',
        minHeight: 140, // Allocate space so it doesn't jump
        justifyContent: 'flex-start',
    },
    button: {
        paddingVertical: 18,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '800',
    },
    outlineButton: {
        paddingVertical: 18,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 2,
    },
    outlineButtonText: {
        fontSize: 18,
        fontWeight: '800',
    },
});
