import React, { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator,
    TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { shoppingAPI, ShoppingItem } from '../services/api';
import { AnimatedListItem } from '../components/AnimatedListItem';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';

export default function ShoppingListScreen() {
    const { t } = useI18n();
    const toast = useToast();
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [input, setInput] = useState('');

    const fetch = useCallback(async () => {
        try {
            const data = await shoppingAPI.list();
            setItems(data);
        } catch (e: any) {
            toast.show(e?.response?.data?.detail || t('shopping.errFetch'), 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t, toast]);

    useFocusEffect(
        useCallback(() => {
            fetch();
        }, [fetch])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetch();
    };

    const add = async () => {
        const name = input.trim();
        if (!name) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setInput('');
        try {
            const created = await shoppingAPI.add(name);
            setItems(prev => [created, ...prev]);
        } catch {
            fetch();
        }
    };

    const togglePurchased = async (item: ShoppingItem) => {
        Haptics.selectionAsync();
        const next = !item.purchased;
        setItems(prev => prev.map(i => (i.id === item.id ? { ...i, purchased: next } : i)));
        try {
            await shoppingAPI.update(item.id, next);
        } catch {
            fetch();
        }
    };

    const remove = async (id: number) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setItems(prev => prev.filter(i => i.id !== id));
        try {
            await shoppingAPI.remove(id);
        } catch {
            fetch();
        }
    };

    const clearPurchased = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setItems(prev => prev.filter(i => !i.purchased));
        try {
            await shoppingAPI.clearPurchased();
        } catch {
            fetch();
        }
    };

    const purchasedCount = items.filter(i => i.purchased).length;

    const renderItem = ({ item, index }: { item: ShoppingItem; index: number }) => (
        <AnimatedListItem index={index} delayMs={30}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => togglePurchased(item)}>
                <Card style={{ ...styles.card, ...(item.purchased ? styles.cardPurchased : {}) }}>
                    <View style={styles.row}>
                        <View style={[styles.checkbox, item.purchased && styles.checkboxOn]}>
                            {item.purchased ? <Text style={styles.checkmark}>✓</Text> : null}
                        </View>
                        <Text style={[styles.name, item.purchased && styles.namePurchased]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <TouchableOpacity onPress={() => remove(item.id)} hitSlop={10}>
                            <Text style={styles.remove}>✕</Text>
                        </TouchableOpacity>
                    </View>
                </Card>
            </TouchableOpacity>
        </AnimatedListItem>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>{t('shopping.title')}</Text>
                    <Text style={styles.subtitle}>{t('shopping.subtitle')}</Text>
                </View>

                {loading && items.length === 0 ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={items}
                        keyExtractor={i => String(i.id)}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Text style={styles.emptyEmoji}>🛒</Text>
                                <Text style={styles.emptyTitle}>{t('shopping.empty')}</Text>
                                <Text style={styles.emptyHint}>{t('shopping.emptyHint')}</Text>
                            </View>
                        }
                    />
                )}

                {purchasedCount > 0 ? (
                    <TouchableOpacity onPress={clearPurchased} style={styles.clearBar}>
                        <Text style={styles.clearText}>
                            {t('shopping.clearPurchased')} ({purchasedCount})
                        </Text>
                    </TouchableOpacity>
                ) : null}

                <View style={styles.addRow}>
                    <TextInput
                        style={styles.input}
                        placeholder={t('shopping.addPlaceholder')}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={add}
                        returnKeyType="done"
                    />
                    <TouchableOpacity onPress={add} style={styles.addButton}>
                        <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: theme.spacing.l, paddingBottom: theme.spacing.m },
    title: { ...theme.typography.h2, marginBottom: theme.spacing.xs },
    subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
    list: { paddingHorizontal: theme.spacing.m, paddingBottom: theme.spacing.s, flexGrow: 1 },
    card: { padding: theme.spacing.m, marginBottom: theme.spacing.s },
    cardPurchased: { opacity: 0.55 },
    row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxOn: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary,
    },
    checkmark: { color: theme.colors.onPrimary, fontWeight: '900' },
    name: { ...theme.typography.body, flex: 1, fontSize: 16, fontWeight: '600' },
    namePurchased: { textDecorationLine: 'line-through' },
    remove: { color: theme.colors.textSecondary, fontSize: 18, paddingHorizontal: 6 },
    addRow: {
        flexDirection: 'row',
        padding: theme.spacing.l,
        gap: theme.spacing.s,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    addButton: {
        width: 56,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.m,
    },
    addButtonText: { color: theme.colors.onPrimary, fontSize: 28, fontWeight: '900' },
    clearBar: {
        alignSelf: 'center',
        marginVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.round,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    clearText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', paddingTop: theme.spacing.xxl },
    emptyEmoji: { fontSize: 56, marginBottom: theme.spacing.m },
    emptyTitle: { ...theme.typography.h3, marginBottom: theme.spacing.xs },
    emptyHint: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 280 },
});
