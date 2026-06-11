import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { useI18n } from '../i18n';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_done_v1';

export async function isOnboardingDone() {
    try {
        return (await AsyncStorage.getItem(ONBOARDING_KEY)) === '1';
    } catch {
        return false;
    }
}

interface Slide {
    icon: string;
    titleKey: string;
    descKey: string;
}

const SLIDES: Slide[] = [
    { icon: '📸', titleKey: 'onboarding.slide1Title', descKey: 'onboarding.slide1Desc' },
    { icon: '🍳', titleKey: 'onboarding.slide2Title', descKey: 'onboarding.slide2Desc' },
    { icon: '👨‍🍳', titleKey: 'onboarding.slide3Title', descKey: 'onboarding.slide3Desc' },
];

interface Props {
    onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
    const { t } = useI18n();
    const [index, setIndex] = useState(0);
    const listRef = useRef<FlatList<Slide>>(null);

    const finish = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await AsyncStorage.setItem(ONBOARDING_KEY, '1');
        onDone();
    };

    const next = () => {
        if (index < SLIDES.length - 1) {
            Haptics.selectionAsync();
            listRef.current?.scrollToIndex({ index: index + 1, animated: true });
        } else {
            finish();
        }
    };

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const i = Math.round(e.nativeEvent.contentOffset.x / width);
        if (i !== index) setIndex(i);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.skipRow}>
                <TouchableOpacity onPress={finish} hitSlop={10}>
                    <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={listRef}
                data={SLIDES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                onMomentumScrollEnd={onScroll}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        <Text style={styles.icon}>{item.icon}</Text>
                        <Text style={styles.title}>{t(item.titleKey)}</Text>
                        <Text style={styles.desc}>{t(item.descKey)}</Text>
                    </View>
                )}
            />

            <View style={styles.dots}>
                {SLIDES.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            i === index && styles.dotActive,
                        ]}
                    />
                ))}
            </View>

            <View style={styles.footer}>
                <Button
                    title={index === SLIDES.length - 1 ? t('onboarding.getStarted') : t('common.next')}
                    onPress={next}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    skipRow: {
        alignItems: 'flex-end',
        padding: theme.spacing.l,
    },
    skipText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    slide: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    icon: {
        fontSize: 110,
        marginBottom: theme.spacing.xl,
    },
    title: {
        ...theme.typography.h1,
        textAlign: 'center',
        marginBottom: theme.spacing.m,
    },
    desc: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 320,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: theme.spacing.m,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.border,
    },
    dotActive: {
        backgroundColor: theme.colors.primary,
        width: 24,
    },
    footer: {
        padding: theme.spacing.l,
    },
});
