import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { historyAPI } from '../services/api';
import { persistPhoto } from '../services/photoStorage';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';

const { width } = Dimensions.get('window');

function parseMinutes(stepText: string): number | null {
    const re = /(\d+)\s*(?:мин(?:ут[аы]?)?|min(?:ute)?s?|m\b)/i;
    const m = stepText.match(re);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    if (isNaN(n) || n <= 0 || n > 180) return null;
    return n;
}

function formatMs(ms: number): string {
    if (ms < 0) ms = 0;
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function CookingModeScreen({ route, navigation }: any) {
    const { steps, dishId, recipeName, imageUri } = route.params as {
        steps: string[];
        dishId: number;
        recipeName: string;
        imageUri?: string;
    };
    const [currentStep, setCurrentStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
    const [now, setNow] = useState(Date.now());
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { t } = useI18n();
    const toast = useToast();

    useEffect(() => {
        if (timerEndsAt) {
            tickRef.current = setInterval(() => setNow(Date.now()), 250);
            return () => {
                if (tickRef.current) clearInterval(tickRef.current);
            };
        }
        return undefined;
    }, [timerEndsAt]);

    useEffect(() => {
        if (timerEndsAt && now >= timerEndsAt) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setTimerEndsAt(null);
        }
    }, [now, timerEndsAt]);

    useEffect(() => {
        setTimerEndsAt(null);
    }, [currentStep]);

    const finish = async () => {
        if (saving || dishId <= 0) {
            navigation.navigate('Main', { screen: 'History' });
            return;
        }
        setSaving(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            const persistedUri = await persistPhoto(imageUri);
            await historyAPI.create(dishId, persistedUri || undefined);
        } catch {
            toast.show(t('cooking.errSaveHistory'), 'error');
        } finally {
            setSaving(false);
            navigation.navigate('Main', { screen: 'History' });
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentStep(currentStep + 1);
        } else {
            finish();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            Haptics.selectionAsync();
            setCurrentStep(currentStep - 1);
        }
    };

    const startTimer = (minutes: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimerEndsAt(Date.now() + minutes * 60 * 1000);
    };

    const stopTimer = () => {
        Haptics.selectionAsync();
        setTimerEndsAt(null);
    };

    const stepText = steps[currentStep];
    const detectedMinutes = parseMinutes(stepText);
    const remainingMs = timerEndsAt ? timerEndsAt - now : 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.recipeName} numberOfLines={1}>{recipeName}</Text>
                <Text style={styles.stepIndicator}>
                    {t('cooking.stepCounter', { current: currentStep + 1, total: steps.length })}
                </Text>
            </View>

            <View style={styles.progressTrack}>
                <View
                    style={[styles.progressFill, { width: `${((currentStep + 1) / steps.length) * 100}%` }]}
                />
            </View>

            <View style={styles.content}>
                <Text style={styles.stepText}>{stepText}</Text>

                {timerEndsAt ? (
                    <View style={styles.timerWrap}>
                        <Text style={styles.timerText}>{formatMs(remainingMs)}</Text>
                        <TouchableOpacity onPress={stopTimer} style={styles.timerStop}>
                            <Text style={styles.timerStopText}>{t('cooking.timerStop')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : detectedMinutes ? (
                    <TouchableOpacity onPress={() => startTimer(detectedMinutes)} style={styles.timerStart}>
                        <Ionicons name="timer-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.timerStartText}>
                            {t('cooking.timerStart')} · {detectedMinutes} min
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            <View style={styles.footer}>
                <Button
                    title={t('cooking.prev')}
                    onPress={handlePrev}
                    disabled={currentStep === 0}
                    variant="secondary"
                    style={styles.navButton}
                />
                <Button
                    title={currentStep === steps.length - 1 ? t('cooking.finish') : t('cooking.next')}
                    onPress={handleNext}
                    style={styles.navButton}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        padding: theme.spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    closeButton: { padding: 8 },
    recipeName: { ...theme.typography.h3, fontSize: 16, color: '#FFF', maxWidth: width * 0.6 },
    stepIndicator: { ...theme.typography.caption, fontSize: 14, color: theme.colors.textSecondary },
    progressTrack: { height: 3, backgroundColor: '#222' },
    progressFill: { height: 3, backgroundColor: theme.colors.primary },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.l,
    },
    stepText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFF',
        textAlign: 'center',
        lineHeight: 38,
        marginBottom: theme.spacing.xl,
    },
    timerStart: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: theme.borderRadius.round,
    },
    timerStartText: { color: theme.colors.primary, fontWeight: '700', fontSize: 14 },
    timerWrap: {
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    timerText: {
        fontSize: 56,
        fontWeight: '900',
        color: theme.colors.primary,
        fontVariant: ['tabular-nums'],
    },
    timerStop: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.round,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    timerStopText: { color: '#FFF', fontWeight: '600' },
    footer: {
        padding: theme.spacing.l,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.m,
    },
    navButton: { flex: 1 },
});
