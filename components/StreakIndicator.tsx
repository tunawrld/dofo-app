import { Colors } from '@/constants/Colors';
import { useTranslation } from '@/lib/i18n';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StreakIndicatorProps {
    currentStreak: number;
    longestStreak: number;
}

const StreakIndicator: React.FC<StreakIndicatorProps> = ({ currentStreak, longestStreak }) => {
    const { t } = useTranslation();
    if (currentStreak === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.streakBadge}>
                <Text style={styles.fireEmoji}>🔥</Text>
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <Text style={styles.streakText}>{t('app.streak_count')}</Text>
            </View>
            {longestStreak > currentStreak && (
                <Text style={styles.recordText}>
                    {t('app.streak_record', { count: longestStreak })}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 12,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.primary + '40',
    },
    fireEmoji: {
        fontSize: 20,
    },
    streakNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
    },
    streakText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    recordText: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.textMuted,
        marginTop: 6,
    },
});

export default StreakIndicator;
