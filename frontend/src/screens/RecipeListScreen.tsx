import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { api } from '../services/api';
import { Loader } from '../components/Loader';
import { Card } from '../components/Card';
import { SkeletonLoader } from '../components/SkeletonLoader';

interface Recipe {
    id: string;
    name: string;
    time: string;
    difficulty: string;
    missingIngredients: string[];
    image: string;
}

export default function RecipeListScreen({ navigation, route }: any) {
    const { products } = route.params;
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

    useEffect(() => {
        fetchRecipes();
    }, []);

    useEffect(() => {
        filterRecipes();
    }, [searchQuery, filterDifficulty, recipes]);

    const fetchRecipes = async () => {
        try {
            const result = await api.generateRecipes(products);
            setRecipes(result);
            setFilteredRecipes(result);
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось найти рецепты');
        } finally {
            setLoading(false);
        }
    };

    const filterRecipes = () => {
        let result = recipes;

        if (searchQuery) {
            result = result.filter(r =>
                r.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterDifficulty) {
            result = result.filter(r => r.difficulty === filterDifficulty);
        }

        setFilteredRecipes(result);
    };

    const renderRecipe = ({ item }: { item: Recipe }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('RecipeDetail', { recipe: item })}
        >
            <Card style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <View style={styles.content}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.details}>
                        <Text style={styles.detailText}>⏱ {item.time}</Text>
                        <Text style={styles.detailText}>📊 {item.difficulty}</Text>
                    </View>
                    {item.missingIngredients.length > 0 && (
                        <Text style={styles.missing}>
                            Нужно докупить: {item.missingIngredients.join(', ')}
                        </Text>
                    )}
                </View>
            </Card>
        </TouchableOpacity>
    );

    const renderSkeleton = () => (
        <View>
            <SkeletonLoader height={200} style={{ marginBottom: 16 }} />
            <SkeletonLoader height={200} style={{ marginBottom: 16 }} />
            <SkeletonLoader height={200} style={{ marginBottom: 16 }} />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>РЕЦЕПТЫ</Text>
                <Text style={styles.subtitle}>
                    {loading ? 'ПОДБИРАЕМ ЛУЧШЕЕ...' : `НАЙДЕНО ${filteredRecipes.length} БЛЮД`}
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
                    {['ЛЕГКО', 'СРЕДНЕ', 'СЛОЖНО'].map(diff => (
                        <TouchableOpacity
                            key={diff}
                            style={[
                                styles.chip,
                                filterDifficulty === diff && styles.chipActive
                            ]}
                            onPress={() => setFilterDifficulty(filterDifficulty === diff ? null : diff)}
                        >
                            <Text style={[
                                styles.chipText,
                                filterDifficulty === diff && styles.chipTextActive
                            ]}>{diff}</Text>
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
                    data={filteredRecipes}
                    keyExtractor={item => item.id}
                    renderItem={renderRecipe}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>РЕЦЕПТЫ НЕ НАЙДЕНЫ</Text>
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
        color: '#FFF',
        fontWeight: '600',
    },
    list: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.xl,
    },
    card: {
        padding: 0,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 150,
    },
    content: {
        padding: theme.spacing.m,
    },
    name: {
        ...theme.typography.h3,
        marginBottom: theme.spacing.s,
    },
    details: {
        flexDirection: 'row',
        gap: theme.spacing.m,
        marginBottom: theme.spacing.s,
    },
    detailText: {
        ...theme.typography.caption,
        fontSize: 14,
    },
    missing: {
        fontSize: 13,
        color: theme.colors.secondary,
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xl,
    },
});
