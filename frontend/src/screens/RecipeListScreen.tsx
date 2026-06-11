import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { dishesAPI, DishOut } from '../services/api';
import { Card } from '../components/Card';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { AnimatedListItem } from '../components/AnimatedListItem';
import { useI18n } from '../i18n';
import { dishImage } from '../i18n/dishes';
import { useToast } from '../components/Toast';

export default function RecipeListScreen({ navigation, route }: any) {
    const { products, imageUri } = route.params as { products: string[]; imageUri?: string };
    const [generatingFreeform, setGeneratingFreeform] = useState(false);
    const [dishes, setDishes] = useState<DishOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState<DishOut['difficulty'] | null>(null);
    const { t, tProduct, tDish, lang } = useI18n();
    const toast = useToast();

    useEffect(() => {
        fetchDishes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDishes = async () => {
        try {
            const result = await dishesAPI.find(products);
            setDishes(result);
        } catch (error: any) {
            const message = error?.response?.data?.detail || t('recipes.errFetch');
            toast.show(message, 'error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        let result = dishes;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(d => tDish(d.title).toLowerCase().includes(q) || d.title.toLowerCase().includes(q));
        }
        if (filterDifficulty) {
            result = result.filter(d => d.difficulty === filterDifficulty);
        }
        return result;
    }, [dishes, searchQuery, filterDifficulty, tDish]);

    const renderRecipe = ({ item, index }: { item: DishOut; index: number }) => (
        <AnimatedListItem index={index} delayMs={45}>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                    Haptics.selectionAsync();
                    navigation.navigate('RecipeDetail', { dish: item, userIngredients: products, imageUri });
                }}
            >
                <Card style={styles.card}>
                    <View style={styles.cardRow}>
                        <Image source={dishImage(item.title)} style={styles.thumb} />
                        <View style={styles.cardBody}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.name} numberOfLines={2}>{tDish(item.title)}</Text>
                                <Text style={styles.difficulty}>{t(`recipes.difficulty.${item.difficulty}`)}</Text>
                            </View>
                            {item.missing_ingredients.length > 0 ? (
                                <Text style={styles.missing} numberOfLines={2}>
                                    {t('recipes.needBuy', {
                                        count: item.missing_count,
                                        items: item.missing_ingredients.map(tProduct).join(', '),
                                    })}
                                </Text>
                            ) : (
                                <Text style={styles.allHave}>{t('recipes.allHave')}</Text>
                            )}
                        </View>
                    </View>
                </Card>
            </TouchableOpacity>
        </AnimatedListItem>
    );

    const renderSkeleton = () => (
        <View>
            <SkeletonLoader height={120} style={{ marginBottom: 16 }} />
            <SkeletonLoader height={120} style={{ marginBottom: 16 }} />
            <SkeletonLoader height={120} style={{ marginBottom: 16 }} />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('recipes.title')}</Text>
                <Text style={styles.subtitle}>
                    {loading ? t('recipes.searching') : t('recipes.countFound', { count: filtered.length })}
                </Text>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={t('recipes.searchPlaceholder')}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.filters}>
                    {(['easy', 'medium', 'hard'] as const).map(diff => (
                        <TouchableOpacity
                            key={diff}
                            style={[styles.chip, filterDifficulty === diff && styles.chipActive]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setFilterDifficulty(filterDifficulty === diff ? null : diff);
                            }}
                        >
                            <Text style={[styles.chipText, filterDifficulty === diff && styles.chipTextActive]}>
                                {t(`recipes.difficulty.${diff}`)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <View style={styles.list}>
                    {renderSkeleton()}
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderRecipe}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyEmoji}>🤖</Text>
                            <Text style={styles.emptyTitle}>{t('recipes.empty')}</Text>
                            <Text style={styles.emptyHint}>{t('recipes.emptyHint')}</Text>
                            <TouchableOpacity
                                style={styles.freeformButton}
                                onPress={async () => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setGeneratingFreeform(true);
                                    try {
                                        const recipe = await dishesAPI.generateFreeForm(products, lang);
                                        navigation.replace('RecipeDetail', {
                                            dish: {
                                                id: -1,
                                                title: recipe.title,
                                                difficulty: 'easy',
                                                missing_count: 0,
                                                missing_ingredients: [],
                                            },
                                            userIngredients: products,
                                            imageUri,
                                            preGenerated: recipe,
                                        });
                                    } catch (e: any) {
                                        toast.show(e?.response?.data?.detail || t('detail.errGenerate'), 'error');
                                    } finally {
                                        setGeneratingFreeform(false);
                                    }
                                }}
                                disabled={generatingFreeform}
                            >
                                {generatingFreeform ? (
                                    <ActivityIndicator color={theme.colors.onPrimary} />
                                ) : (
                                    <Text style={styles.freeformText}>✨ {t('recipes.emptyCta')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
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
        paddingBottom: theme.spacing.s,
    },
    title: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        ...theme.typography.body,
        marginBottom: theme.spacing.m,
    },
    searchContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: 12,
        marginBottom: theme.spacing.m,
    },
    input: {
        color: theme.colors.text,
        fontSize: 16,
    },
    filters: {
        flexDirection: 'row',
        gap: theme.spacing.s,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: theme.borderRadius.round,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    chipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    chipText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    chipTextActive: {
        color: '#000',
        fontWeight: '600',
    },
    list: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.xl,
    },
    card: {
        padding: theme.spacing.s,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
    },
    thumb: {
        width: 72,
        height: 72,
        borderRadius: theme.borderRadius.m,
        backgroundColor: theme.colors.surfaceAlt,
    },
    cardBody: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
        gap: theme.spacing.s,
    },
    name: {
        ...theme.typography.h3,
        flex: 1,
        fontSize: 16,
    },
    difficulty: {
        ...theme.typography.caption,
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.s,
    },
    missing: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    allHave: {
        fontSize: 13,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    emptyWrap: { alignItems: 'center', paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.l },
    emptyEmoji: { fontSize: 56, marginBottom: theme.spacing.m },
    emptyTitle: { ...theme.typography.h3, marginBottom: theme.spacing.s, textAlign: 'center' },
    emptyHint: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.l },
    freeformButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: theme.borderRadius.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    freeformText: { color: theme.colors.onPrimary, fontWeight: '800', fontSize: 16 },
});
