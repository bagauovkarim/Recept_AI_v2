import React, { useCallback, useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, SectionList, RefreshControl, ActivityIndicator,
    Image, TouchableOpacity, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { historyAPI, HistoryEntry, dishesAPI, DishOut } from '../services/api';
import { AnimatedListItem } from '../components/AnimatedListItem';
import { useI18n } from '../i18n';
import { dishImage } from '../i18n/dishes';
import { useToast } from '../components/Toast';

type Group = 'today' | 'yesterday' | 'earlier';

function classifyDate(iso: string): Group {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'today';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'yesterday';
    return 'earlier';
}

export default function HistoryScreen() {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t, tDish, lang } = useI18n();
    const toast = useToast();
    const navigation = useNavigation<any>();

    const formatTime = useCallback((iso: string): string => {
        const d = new Date(iso);
        const localeTag = lang === 'en' ? 'en-US' : 'ru-RU';
        return d.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' });
    }, [lang]);

    const formatFullDate = useCallback((iso: string): string => {
        const d = new Date(iso);
        const localeTag = lang === 'en' ? 'en-US' : 'ru-RU';
        return d.toLocaleDateString(localeTag, { day: 'numeric', month: 'long' }) + ` · ${formatTime(iso)}`;
    }, [lang, formatTime]);

    const fetchHistory = useCallback(async () => {
        try {
            setError(null);
            const data = await historyAPI.getAll();
            setEntries(data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || t('history.errFetch'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const sections = useMemo(() => {
        const groups: Record<Group, HistoryEntry[]> = { today: [], yesterday: [], earlier: [] };
        entries.forEach(e => groups[classifyDate(e.cooked_at)].push(e));
        const out: { titleKey: string; data: HistoryEntry[] }[] = [];
        if (groups.today.length) out.push({ titleKey: 'history.groupToday', data: groups.today });
        if (groups.yesterday.length) out.push({ titleKey: 'history.groupYesterday', data: groups.yesterday });
        if (groups.earlier.length) out.push({ titleKey: 'history.groupEarlier', data: groups.earlier });
        return out;
    }, [entries]);

    const openRecipe = async (entry: HistoryEntry) => {
        if (entry.dish_id <= 0) return;
        Haptics.selectionAsync();
        try {
            const detail = await dishesAPI.getDetail(entry.dish_id);
            const dish: DishOut = {
                id: detail.id,
                title: detail.title,
                difficulty: detail.difficulty,
                missing_count: 0,
                missing_ingredients: [],
            };
            navigation.navigate('RecipeDetail', {
                dish,
                userIngredients: detail.ingredients,
                imageUri: entry.image_uri || undefined,
                useCache: true,
            });
        } catch (e: any) {
            toast.show(e?.response?.data?.detail || t('common.error'), 'error');
        }
    };

    const confirmDelete = (entry: HistoryEntry) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            t('history.deleteConfirm'),
            entry.dish_title || `#${entry.dish_id}`,
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        setEntries(prev => prev.filter(e => e.id !== entry.id));
                        try {
                            await historyAPI.delete(entry.id);
                        } catch (e: any) {
                            toast.show(e?.response?.data?.detail || t('common.error'), 'error');
                            fetchHistory();
                        }
                    },
                },
            ]
        );
    };

    const renderRightAction = () => (progress: Animated.AnimatedInterpolation<number>) => {
        const trans = progress.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
        return (
            <Animated.View style={[styles.deleteAction, { transform: [{ translateX: trans }] }]}>
                <Text style={styles.deleteText}>✕</Text>
            </Animated.View>
        );
    };

    const renderItem = ({ item, index }: { item: HistoryEntry; index: number }) => {
        const g = classifyDate(item.cooked_at);
        const subtitle =
            g === 'today' ? t('history.today', { time: formatTime(item.cooked_at) }) :
            g === 'yesterday' ? t('history.yesterday', { time: formatTime(item.cooked_at) }) :
            formatFullDate(item.cooked_at);

        return (
            <AnimatedListItem index={index} delayMs={30}>
                <Swipeable
                    renderRightActions={renderRightAction()}
                    onSwipeableOpen={() => confirmDelete(item)}
                    rightThreshold={40}
                >
                    <TouchableOpacity activeOpacity={0.85} onPress={() => openRecipe(item)}>
                        <Card style={styles.card}>
                            <View style={styles.cardRow}>
                                {item.dish_title ? (
                                    <Image source={dishImage(item.dish_title)} style={styles.thumb} />
                                ) : (
                                    <View style={[styles.thumb, styles.thumbFallback]}>
                                        <Text style={styles.thumbEmoji}>🍳</Text>
                                    </View>
                                )}
                                <View style={styles.cardText}>
                                    <Text style={styles.name} numberOfLines={1}>
                                        {item.dish_title ? tDish(item.dish_title) : t('history.unnamedDish', { id: item.dish_id })}
                                    </Text>
                                    <Text style={styles.date}>{subtitle}</Text>
                                </View>
                            </View>
                        </Card>
                    </TouchableOpacity>
                </Swipeable>
            </AnimatedListItem>
        );
    };

    const renderSectionHeader = ({ section }: any) => (
        <Text style={styles.sectionHeader}>{t(section.titleKey)}</Text>
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('history.title')}</Text>
                    <Text style={styles.subtitle}>{t('history.subtitle')}</Text>
                </View>

                {loading && entries.length === 0 ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : error ? (
                    <View style={styles.center}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : (
                    <SectionList
                        sections={sections}
                        keyExtractor={item => String(item.id)}
                        renderItem={renderItem}
                        renderSectionHeader={renderSectionHeader}
                        contentContainerStyle={styles.list}
                        stickySectionHeadersEnabled={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={theme.colors.primary}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyWrap}>
                                <Text style={styles.emptyEmoji}>📜</Text>
                                <Text style={styles.emptyTitle}>{t('history.empty')}</Text>
                                <Text style={styles.emptyHint}>{t('history.emptyHint')}</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: theme.spacing.l, paddingBottom: theme.spacing.m },
    title: { ...theme.typography.h2, marginBottom: theme.spacing.xs },
    subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
    list: { paddingHorizontal: theme.spacing.m, paddingBottom: theme.spacing.xl, flexGrow: 1 },
    sectionHeader: {
        ...theme.typography.caption,
        marginTop: theme.spacing.l,
        marginBottom: theme.spacing.s,
        paddingHorizontal: 4,
    },
    card: { padding: theme.spacing.s, marginBottom: theme.spacing.s },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
    thumb: { width: 56, height: 56, borderRadius: theme.borderRadius.m, backgroundColor: theme.colors.surfaceAlt },
    thumbFallback: { alignItems: 'center', justifyContent: 'center' },
    thumbEmoji: { fontSize: 26 },
    cardText: { flex: 1 },
    name: { ...theme.typography.body, fontSize: 16, fontWeight: '700', marginBottom: 2 },
    date: { ...theme.typography.caption, fontSize: 11 },
    deleteAction: {
        backgroundColor: theme.colors.error,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: theme.spacing.l,
        marginBottom: theme.spacing.s,
        borderRadius: theme.borderRadius.m,
    },
    deleteText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.l },
    errorText: { ...theme.typography.body, textAlign: 'center', color: theme.colors.textSecondary },
    emptyWrap: { alignItems: 'center', paddingTop: theme.spacing.xxl },
    emptyEmoji: { fontSize: 56, marginBottom: theme.spacing.m },
    emptyTitle: { ...theme.typography.h3, marginBottom: theme.spacing.xs },
    emptyHint: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 280 },
});
