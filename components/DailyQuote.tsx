import { useThemeColors } from '@/hooks/useThemeColors';
import { useTranslation } from '@/lib/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STORAGE_KEY = 'daily_motivation_quote';
const QUOTE_COUNT = 10;

interface StoredQuoteData {
    date: string;
    quoteIndex: number;
    shownIndices: number[];
}

export default function DailyQuote() {
    const C = useThemeColors();
    const { t } = useTranslation();
    const [quoteIndex, setQuoteIndex] = useState<number>(0);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadQuote();
    }, []);

    const loadQuote = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const storedDataJson = await AsyncStorage.getItem(STORAGE_KEY);
            let storedData: StoredQuoteData | null = storedDataJson ? JSON.parse(storedDataJson) : null;

            if (storedData && storedData.date === today && storedData.quoteIndex < QUOTE_COUNT) {
                setQuoteIndex(storedData.quoteIndex);
            } else {
                let shownIndices = storedData ? storedData.shownIndices : [];

                if (shownIndices.length >= QUOTE_COUNT) {
                    shownIndices = [];
                }

                const allIndices = Array.from({ length: QUOTE_COUNT }, (_, i) => i);
                const availableIndices = allIndices.filter(i => !shownIndices.includes(i));

                let newIndex;
                if (availableIndices.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableIndices.length);
                    newIndex = availableIndices[randomIndex];
                } else {
                    newIndex = Math.floor(Math.random() * QUOTE_COUNT);
                    shownIndices = [];
                }

                const newData: StoredQuoteData = {
                    date: today,
                    quoteIndex: newIndex,
                    shownIndices: [...shownIndices, newIndex]
                };

                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
                setQuoteIndex(newIndex);
            }
        } catch (e) {
            console.error("Failed to load quote", e);
            setQuoteIndex(0);
        }
    };

    return (
        <View style={[styles.container, { bottom: insets.bottom + 15 }]}>
            <Text style={[styles.text, { color: C.textMuted }]}>{t(`quotes.${quoteIndex}`)}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
        opacity: 0.7,
    },
    text: {
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
        fontWeight: '300',
    }
});
