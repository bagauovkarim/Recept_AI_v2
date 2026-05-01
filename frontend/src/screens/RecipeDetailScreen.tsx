import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { dishesAPI, historyAPI, GeneratedRecipe, DishOut } from '../services/api';

export default function RecipeDetailScreen({ route, navigation }: any) {
    const { dish, userIngredients } = route.params as { dish: DishOut; userIngredients: string[] };
    const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        generate();
    }, []);

    const generate = async () => {
        try {
            setLoading(true);
            const allIngredients = [
                ...new Set([...userIngredients, ...dish.missing_ingredients]),
            ];
            const r = await dishesAPI.generateRecipe(dish.title, allIngredients);
            setRecipe(r);
        } catch (error: any) {
            const message = error?.response?.data?.detail || 'Не удалось сгенерировать рецепт';
            Alert.alert('Ошибка', message);
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    if (loading || !recipe) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Готовим рецепт...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.section}>
                <Text style={styles.title}>{recipe.title}</Text>
                <View style={styles.badges}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>⏱ {recipe.cooking_time}</Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>🍽 {recipe.servings}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ингредиенты</Text>
                {recipe.ingredients.map((ing, index) => (
                    <View key={index} style={styles.row}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>{ing}</Text>
                    </View>
                ))}
                {dish.missing_ingredients.length > 0 && (
                    <Text style={styles.missingNote}>
                        Не хватает: {dish.missing_ingredients.join(', ')}
                    </Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Приготовление</Text>
                {recipe.steps.map((step, index) => (
                    <View key={index} style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.text}>{step}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.footer}>
                <Button
                    title="НАЧАТЬ ГОТОВИТЬ"
                    onPress={() => navigation.navigate('CookingMode', {
                        steps: recipe.steps,
                        dishId: dish.id,
                        recipeName: recipe.title,
                    })}
                    style={{ marginBottom: 10 }}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.l,
    },
    loadingText: {
        ...theme.typography.body,
    },
    content: {
        paddingBottom: 40,
    },
    section: {
        padding: theme.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        ...theme.typography.h1,
        marginBottom: theme.spacing.m,
    },
    badges: {
        flexDirection: 'row',
        gap: theme.spacing.m,
    },
    badge: {
        backgroundColor: theme.colors.surface,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: theme.borderRadius.s,
    },
    badgeText: {
        color: theme.colors.text,
        fontWeight: '600',
    },
    sectionTitle: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.m,
    },
    row: {
        flexDirection: 'row',
        marginBottom: theme.spacing.s,
    },
    bullet: {
        color: theme.colors.primary,
        marginRight: theme.spacing.s,
        fontSize: 18,
    },
    text: {
        ...theme.typography.body,
        flex: 1,
        lineHeight: 22,
    },
    missingNote: {
        ...theme.typography.caption,
        marginTop: theme.spacing.m,
        color: theme.colors.textSecondary,
    },
    step: {
        flexDirection: 'row',
        marginBottom: theme.spacing.l,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.m,
        marginTop: 2,
    },
    stepNumberText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    footer: {
        padding: theme.spacing.l,
    },
});
