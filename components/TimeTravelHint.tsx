import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/lib/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORAGE_KEY = 'timeTravelHintShown';

interface TimeTravelHintProps {
    pagerRef: React.RefObject<any>;
    currentPage: number;
}

export default function TimeTravelHint({ pagerRef, currentPage }: TimeTravelHintProps) {
    const C = useThemeColors();
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [checked, setChecked] = useState(false);

    // Overlay opacity (tüm hint'in görünürlüğü)
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    // "Zamanda gez" yazısının opacity'si
    const textOpacity = useRef(new Animated.Value(0)).current;
    // Ok ikonları için opacity
    const arrowOpacity = useRef(new Animated.Value(0)).current;
    // Pager translate (simüle edilen kayma hissi için hafif bir scale/blur değil, gerçek sayfa geçişi yapacağız)
    // Ama ek olarak overlay'deki "yön" efekti için:
    const leftArrowX = useRef(new Animated.Value(0)).current;
    const rightArrowX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        checkAndShow();
    }, []);

    const checkAndShow = async () => {
        try {
            const shown = await AsyncStorage.getItem(STORAGE_KEY);
            if (shown === null) {
                setChecked(true);
                // Kısa bir gecikme ile başlat (app tamamen mount olsun)
                setTimeout(() => {
                    setVisible(true);
                    runAnimation();
                }, 800);
            } else {
                setChecked(true);
            }
        } catch {
            setChecked(true);
        }
    };

    const runAnimation = () => {
        // 1. Overlay fade in
        Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();

        // 2. Ok ikonları belirir
        setTimeout(() => {
            Animated.timing(arrowOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }, 300);

        // 3. Sağa git (page + 1)
        setTimeout(() => {
            pagerRef.current?.setPage(currentPage + 1);
        }, 500);

        // 4. Sola git (page - 1) — sağa gitmenin hemen ardından
        setTimeout(() => {
            pagerRef.current?.setPage(currentPage - 1);
        }, 1100);

        // 5. Geri merkeze dön
        setTimeout(() => {
            pagerRef.current?.setPage(currentPage);
        }, 1700);

        // 6. "Zamanda gez" yazısı belirir
        setTimeout(() => {
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();

            // Ok ikonları kaybolur
            Animated.timing(arrowOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start();

            // Ok animasyonu: sola ve sağa doğru hareket
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(leftArrowX, { toValue: -8, duration: 300, useNativeDriver: true }),
                    Animated.timing(rightArrowX, { toValue: 8, duration: 300, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(leftArrowX, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.timing(rightArrowX, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]),
            ]).start();
        }, 2100);

        // 7. Her şey fade out olur ve bileşen kapanır
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(textOpacity, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start(async () => {
                setVisible(false);
                await AsyncStorage.setItem(STORAGE_KEY, 'true');
            });
        }, 3600);
    };

    if (!checked || !visible) return null;

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                StyleSheet.absoluteFillObject,
                styles.overlay,
                { opacity: overlayOpacity },
            ]}
        >
            {/* Üst kısım: "Zamanda gez" yazısı */}
            <Animated.View style={[styles.topBar, { opacity: textOpacity }]}>
                <Text style={[styles.hint, { color: C.textLight }]}>{t('app.time_travel')}</Text>
                <View style={styles.line} />
            </Animated.View>

            {/* Ok ikonları (kayma esnasında) */}
            <Animated.View style={[styles.arrowsRow, { opacity: arrowOpacity }]}>
                <Animated.Text
                    style={[
                        styles.arrow,
                        { color: C.primary, transform: [{ translateX: leftArrowX }] },
                    ]}
                >
                    ‹
                </Animated.Text>
                <Animated.Text
                    style={[
                        styles.arrow,
                        { color: C.primary, transform: [{ translateX: rightArrowX }] },
                    ]}
                >
                    ›
                </Animated.Text>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        zIndex: 9998,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingTop: 60,
    },
    topBar: {
        alignItems: 'center',
        gap: 10,
    },
    hint: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 3,
        textTransform: 'uppercase',
        opacity: 0.85,
    },
    line: {
        width: 32,
        height: 1.5,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 1,
    },
    arrowsRow: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        pointerEvents: 'none',
    },
    arrow: {
        fontSize: 64,
        fontWeight: '100',
        opacity: 0.6,
        lineHeight: 70,
    },
});
