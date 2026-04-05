import { Colors } from '@/constants/Colors';
import { useTranslation } from '@/lib/i18n';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface ComboOverlayProps {
    count: number;
    visible: boolean;
    onAnimationFinish?: () => void;
}

export default function ComboOverlay({ count, visible, onAnimationFinish }: ComboOverlayProps) {
    const { t } = useTranslation();
    const [localCount, setLocalCount] = useState(count);
    const scale = useSharedValue(0.5);
    const opacity = useSharedValue(0);
    const rotate = useSharedValue(0);

    // Derived data based on current count
    const getComboData = (c: number) => {
        const index = Math.min(c, 6);
        const colors = [
            Colors.primary, // 0
            Colors.primary, // 1
            '#6ee7b7',      // 2
            '#93c5fd',      // 3
            '#c4b5fd',      // 4
            '#fcd34d',      // 5
            '#f87171',      // 6
        ];
        return {
            text: index >= 2 ? t(`app.combo_${index}`) : '',
            color: colors[index] || Colors.primary
        };
    };

    const currentCombo = getComboData(localCount);

    useEffect(() => {
        if (visible && count >= 2) {
            setLocalCount(count);

            // Pop Animation
            scale.value = 0.5;
            rotate.value = Math.random() * 0.1 - 0.05;
            
            scale.value = withSpring(1.0, { damping: 8, stiffness: 150 });
            opacity.value = withTiming(1, { duration: 100 });

            // Auto Hide (Reset every time a new combo comes in)
            const timeout = setTimeout(() => {
                opacity.value = withTiming(0, { duration: 300 }, () => {
                    if (onAnimationFinish) {
                        runOnJS(onAnimationFinish)();
                    }
                });
            }, 1000);

            return () => {
                clearTimeout(timeout);
            };
        }
    }, [visible, count]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}rad` }
        ],
        opacity: opacity.value,
    }));

    if (!visible || localCount < 2) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.centerContainer}>
                <Animated.View style={[styles.textContainer, animatedStyle]}>
                    <Text style={[styles.comboCount, { color: currentCombo.color, textShadowColor: currentCombo.color }]}>
                        {localCount}x
                    </Text>
                    <Text style={[styles.comboText, { color: Colors.white }]}>
                        {currentCombo.text}
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    textContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    comboCount: {
        fontSize: 90,
        fontWeight: '800',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-rounded',
        // @ts-ignore
        fontDesign: 'rounded',
        letterSpacing: -2,
        marginBottom: -10,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    comboText: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: 1,
        // @ts-ignore
        fontDesign: 'rounded',
        opacity: 0.95,
        textTransform: 'capitalize',
    },
});

