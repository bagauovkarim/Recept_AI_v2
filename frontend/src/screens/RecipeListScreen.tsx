import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { dishesAPI, DishOut } from '../services/api';
import { Card } from '../components/Card';
import { SkeletonLoader } from '../components/SkeletonLoader';

const DIFFICULTY_LABEL: Record<DishOut['difficulty'], string> = {
    easy: 'ЛЕГКО',
    medium: 'СРЕДНЕ',
    hard: 'СЛОЖНО',
};

export default function RecipeListScreen({ navigation, route }: any) {
    const { products } = route.params as { products: string[] };
    const [dishes, setDishes] = useState<DishOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState<DishOut['difficulty'] | null>(null);

    useEffect(() => {
        fetchDishes();
    }, []);

    const fetchDishes = async () => {
        try {
            const result = await dishesAPI.find(products);
            setDishes(result);
        } catch (error: any) {
            const message = error?.response?.data?.detail || 'Не удалось найти рецепты';
            Alert.alert('Ошибка', message);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        let result = dishes;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(d => d.title.toLowerCase().includes(q));
        }
        if (filterDifficulty) {
            result = result.filter(d => d.difficulty === filterDifficulty);
        }
        return result;
    }, [dishes, searchQuery, filterDifficulty]);

    const renderRecipe = ({ item }: { item: DishOut }) => (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('RecipeDetail', {
                dish: item,
                userIngredients: products,
            })}
        >
            <Card style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.name}>{item.title}</Text>
                    <Text style={styles.difficulty}>{DIFFICULTY_LABEL[item.difficulty] || item.difficulty}</Text>
                </View>
                {item.missing_ingredients.length > 0 ? (
                    <Text style={styles.missing}>
                        Нужно докупить ({item.missing_count}): {item.missing_ingredients.join(', ')}
                    </Text>
                ) : (
                    <Text style={styles.allHave}>Все ингредиенты у тебя есть ✓</Text>
                )}
            </Card>
        </TouchableOpacity>
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
                <Text style={styles.title}>РЕЦЕПТЫ</Text>
                <Text style={styles.subtitle}>
                    {loading ? 'ПОДБИРАЕМ ЛУЧШЕЕ...' : `НАЙДЕНО ${filtered.length} БЛЮД`}
                </Text>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="ПОИСК РЕЦЕПТА..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.filters}>
                    {(['easy', 'medium', 'hard'] as const).map(diff => (
                        <TouchableOpacity
                            key={diff}
                            style={[
                                styles.chip,
                                filterDifficulty === diff && styles.chipActive,
                            ]}
                            onPress={() => setFilterDifficulty(filterDifficulty === diff ? null : diff)}
                        >
                            <Text style={[
                                styles.chipText,
                                filterDifficulty === diff && styles.chipTextActive,
                            ]}>
                                {DIFFICULTY_LABEL[diff]}
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
                        <Text style={styles.emptyText}>
                            РЕЦЕПТЫ НЕ НАЙДЕНЫ.{'\n'}
                            ПОПРОБУЙ ДРУГОЙ НАБОР ПРОДУКТОВ.
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
        padding: theme.spacing.m,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    name: {
        ...theme.typography.h3,
        flex: 1,
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
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xl,
        lineHeight: 20,
    },
});
