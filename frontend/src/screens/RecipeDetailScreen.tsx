import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { theme } from '../theme';
import { Button } from '../components/Button';

export default function RecipeDetailScreen({ route, navigation }: any) {
    const { recipe } = route.params;

    // Mock instructions if not present in passed object (since api.ts stub is simple)
    // In real app, we might need to fetch details by ID if list logic is separate
    const instructions = [
        'Подготовьте все ингредиенты.',
        'Нарежьте овощи кубиками.',
        'Смешайте ингредиенты в большой миске.',
        'Добавьте специи по вкусу.',
        'Подавайте блюдо охлажденным.'
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Image source={{ uri: recipe.image }} style={styles.image} />

            <View style={styles.section}>
                <Text style={styles.title}>{recipe.name}</Text>
                <View style={styles.badges}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>⏱ {recipe.time}</Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>📊 {recipe.difficulty}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ингредиенты</Text>
                {recipe.ingredients.map((ing: string, index: number) => (
                    <View key={index} style={styles.row}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={[
                            styles.text,
                            recipe.missingIngredients.includes(ing) && styles.missingText
                        ]}>
                            {ing} {recipe.missingIngredients.includes(ing) && '(нет в наличии)'}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Приготовление</Text>
                {instructions.map((step, index) => (
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
                        steps: instructions,
                        recipeName: recipe.name
                    })}
                    style={{ marginBottom: 10 }}
                />
                <Button
                    title="Приготовил! 😋"
                    onPress={() => navigation.goBack()}
                    variant="outline"
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
    content: {
        paddingBottom: 40,
    },
    image: {
        width: '100%',
        height: 250,
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
        color: theme.colors.text,
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
    missingText: {
        color: theme.colors.secondary,
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
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    footer: {
        padding: theme.spacing.l,
    },
});
