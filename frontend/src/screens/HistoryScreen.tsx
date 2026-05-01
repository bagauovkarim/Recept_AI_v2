import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { historyAPI, HistoryEntry } from '../services/api';

function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const sameYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return `Сегодня в ${time}`;
    if (sameYesterday) return `Вчера в ${time}`;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + ` в ${time}`;
}

export default function HistoryScreen() {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        try {
            setError(null);
            const data = await historyAPI.getAll();
            setEntries(data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Не удалось загрузить историю');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const renderItem = ({ item }: { item: HistoryEntry }) => (
        <Card style={styles.card}>
            <View style={styles.cardContent}>
                <Text style={styles.name}>{item.dish_title || `Блюдо #${item.dish_id}`}</Text>
                <Text style={styles.date}>{formatDate(item.cooked_at)}</Text>
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>История</Text>
                <Text style={styles.subtitle}>Ваши кулинарные достижения</Text>
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
                <FlatList
                    data={entries}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            Пока ничего не приготовлено.{'\n'}
                            Сделай фото холодильника и начни!
                        </Text>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: theme.spacing.l,
        paddingBottom: theme.spacing.m,
    },
    title: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    list: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.xl,
        flexGrow: 1,
    },
    card: {
        padding: theme.spacing.m,
        marginBottom: theme.spacing.s,
    },
    cardContent: {
        flexDirection: 'column',
    },
    name: {
        ...theme.typography.h3,
        fontSize: 16,
        marginBottom: theme.spacing.xs,
    },
    date: {
        ...theme.typography.caption,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.l,
    },
    errorText: {
        ...theme.typography.body,
        textAlign: 'center',
        color: theme.colors.textSecondary,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xxl,
        lineHeight: 22,
    },
});
