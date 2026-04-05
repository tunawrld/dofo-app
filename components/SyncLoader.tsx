import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withDelay, 
    runOnJS,
    Easing 
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/lib/i18n';

export default function SyncLoader({ isVisible }: { isVisible: boolean }) {
    const colors = useThemeColors();
    const { t } = useTranslation();
    const [progress, setProgress] = useState(0);
    const [shouldRender, setShouldRender] = useState(isVisible);
    
    const opacity = useSharedValue(isVisible ? 1 : 0);
    const scale = useSharedValue(isVisible ? 1 : 1.05);
    const barWidth = useSharedValue(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isVisible) {
            setShouldRender(true);
            opacity.value = 1;
            scale.value = 1;
            setProgress(0);
            barWidth.value = 0;
            
            // Sahte (Fake) progress mantığı ile premium dolum hissi (90% civarına kadar)
            interval = setInterval(() => {
                setProgress(p => {
                    const next = p + Math.floor(Math.random() * 12) + 4;
                    const finalVal = next > 90 ? 90 : next;
                    barWidth.value = withTiming(finalVal, { duration: 250, easing: Easing.out(Easing.ease) });
                    return finalVal;
                });
            }, 300);
        } else {
            // Veri yüklemesi bittiyse hızlıca %100 yap
            setProgress(100);
            barWidth.value = withTiming(100, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
            
            // Küçük bir bekleme sonrası yumuşak çıkış animasyonu (Premium Feel)
            opacity.value = withDelay(400, withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }, (finished) => {
                if (finished) {
                    runOnJS(setShouldRender)(false);
                }
            }));
            scale.value = withDelay(400, withTiming(1.08, { duration: 600, easing: Easing.out(Easing.ease) }));
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isVisible]);

    const overlayStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ scale: scale.value }],
        };
    });

    const progressStyle = useAnimatedStyle(() => {
        return {
            width: `${barWidth.value}%`
        };
    });

    const getLoadingText = () => {
        if (progress < 30) return t('app.sync_connecting');
        if (progress < 65) return t('app.sync_loading_tasks');
        if (progress < 95) return t('app.sync_updating_notes');
        if (progress < 100) return t('app.sync_finishing');
        return t('app.sync_done');
    };

    if (!shouldRender) return null;

    return (
        <Animated.View style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: colors.backgroundDark }, overlayStyle]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.primary }]}>dofo</Text>
                
                <View style={[styles.progressBarContainer, { backgroundColor: colors.textMuted + '25' }]}>
                    <Animated.View style={[styles.progressBarFill, { backgroundColor: colors.primary }, progressStyle]} />
                </View>
                
                <View style={styles.loadingTextRow}>
                    <Text style={[styles.progressText, { color: colors.textMuted }]}>
                        {getLoadingText()}
                    </Text>
                    <Text style={[styles.progressPercentage, { color: colors.textLight }]}>
                        {progress}%
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        position: 'absolute',
    },
    content: {
        width: '75%',
        alignItems: 'center',
        marginTop: -50, // Ortadan hafif yukarıda durması göz algısı için daha tatlı
    },
    title: {
        fontSize: 54,
        fontWeight: '900',
        letterSpacing: -2,
        marginBottom: 60,
    },
    progressBarContainer: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    loadingTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    progressPercentage: {
        fontSize: 14,
        fontWeight: '700',
        fontVariant: ['tabular-nums'], // Sayıların sabit genişlikte oynamadan artması için
    }
});
