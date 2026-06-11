import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { favoritesAPI, FavoriteEntry } from '../services/api';
import { AnimatedListItem } from '../components/AnimatedListItem';
import { useI18n } from '../i18n';
import { dishImage } from '../i18n/dishes';
import { useToast } from '../components/Toast';

export default function FavoritesScreen() {
    const { t, tDish } = useI18n();
    const toast = useToast();
    const navigation = useNavigation<any>();
    const [items, setItems] = useState<FavoriteEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetch = useCallback(async () => {
        try {
            const data = await favoritesAPI.list();
            setItems(data);
        } catch (e: any) {
            toast.show(e?.response?.data?.detail || t('favorites.errFetch'), 'error');
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

    const remove = async (dishId: number) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setItems(prev => prev.filter(i => i.dish_id !== dishId));
        try {
            await favoritesAPI.remove(dishId);
        } catch {
            fetch();
        }
    };

    const open = (item: FavoriteEntry) => {
        Haptics.selectionAsync();
        navigation.navigate('RecipeDetail', {
            dish: {
                id: item.dish_id,
                title: item.dish_title || `#${item.dish_id}`,
                difficulty: item.difficulty || 'easy',
                missing_count: 0,
                missing_ingredients: [],
            },
            userIngredients: [],
            useCache: true,
        });
    };

    const renderItem = ({ item, index }: { item: FavoriteEntry; index: number }) => (
        <AnimatedListItem index={index} delayMs={40}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => open(item)}>
                <Card style={styles.card}>
                    <View style={styles.row}>
                        {item.dish_title ? <Image source={dishImage(item.dish_title)} style={styles.thumb} /> : null}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name} numberOfLines={2}>{item.dish_title ? tDish(item.dish_title) : '—'}</Text>
                            {item.difficulty ? (
                                <Text style={styles.diff}>{t(`recipes.difficulty.${item.difficulty}`)}</Text>
                            ) : null}
                        </View>
                        <TouchableOpacity onPress={() => remove(item.dish_id)} hitSlop={10}>
                            <Text style={styles.heart}>♥</Text>
                        </TouchableOpacity>
                    </View>
                </Card>
            </TouchableOpacity>
        </AnimatedListItem>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('favorites.title')}</Text>
                <Text style={styles.subtitle}>{t('favorites.subtitle')}</Text>
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
                            <Text style={styles.emptyEmoji}>💔</Text>
                            <Text style={styles.emptyTitle}>{t('favorites.empty')}</Text>
                            <Text style={styles.emptyHint}>{t('favorites.emptyHint')}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: theme.spacing.l, paddingBottom: theme.spacing.m },
    title: { ...theme.typography.h2, marginBottom: theme.spacing.xs },
    subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
    list: { paddingHorizontal: theme.spacing.m, paddingBottom: theme.spacing.xl, flexGrow: 1 },
    card: { padding: theme.spacing.s, marginBottom: theme.spacing.s },
    row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
    thumb: {
        width: 64,
        height: 64,
        borderRadius: theme.borderRadius.m,
        backgroundColor: theme.colors.surfaceAlt,
    },
    name: { ...theme.typography.h3, fontSize: 16, marginBottom: 4 },
    diff: { ...theme.typography.caption, fontSize: 12 },
    heart: { fontSize: 28, color: theme.colors.primary, paddingHorizontal: 6 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', paddingTop: theme.spacing.xxl },
    emptyEmoji: { fontSize: 56, marginBottom: theme.spacing.m },
    emptyTitle: { ...theme.typography.h3, marginBottom: theme.spacing.xs },
    emptyHint: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 280 },
});
