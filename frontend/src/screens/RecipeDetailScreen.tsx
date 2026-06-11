import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { dishesAPI, favoritesAPI, shoppingAPI, GeneratedRecipe, DishOut } from '../services/api';
import { tryParsePartial } from '../services/partialJson';
import { getCachedRecipe, saveCachedRecipe, clearCachedRecipe } from '../services/recipeCache';
import { AnimatedListItem } from '../components/AnimatedListItem';
import { useI18n } from '../i18n';
import { dishImage } from '../i18n/dishes';
import { useToast } from '../components/Toast';

type PartialRecipe = Partial<GeneratedRecipe>;

export default function RecipeDetailScreen({ route, navigation }: any) {
    const { dish, userIngredients, imageUri, preGenerated, useCache } = route.params as {
        dish: DishOut;
        userIngredients: string[];
        imageUri?: string;
        preGenerated?: GeneratedRecipe;
        useCache?: boolean;
    };
    const [recipe, setRecipe] = useState<PartialRecipe | null>(preGenerated || null);
    const [streaming, setStreaming] = useState(!preGenerated);
    const [done, setDone] = useState(!!preGenerated);
    const [favored, setFavored] = useState(false);
    const [fromCache, setFromCache] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const { t, tProduct, lang } = useI18n();
    const toast = useToast();

    const isPersistedDish = dish.id > 0;

    useEffect(() => {
        if (!preGenerated) loadOrGenerate();
        if (isPersistedDish) checkFavorited();
        return () => {
            abortRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadOrGenerate = async () => {
        if (useCache && isPersistedDish) {
            const cached = await getCachedRecipe(dish.id, lang);
            if (cached) {
                setRecipe(cached);
                setStreaming(false);
                setDone(true);
                setFromCache(true);
                return;
            }
        }
        await streamFromApi();
    };

    const streamFromApi = async () => {
        setFromCache(false);
        try {
            setStreaming(true);
            setDone(false);
            setRecipe(null);
            let baseIngredients = userIngredients;
            if (baseIngredients.length === 0 && isPersistedDish) {
                try {
                    const detail = await dishesAPI.getDetail(dish.id);
                    baseIngredients = detail.ingredients;
                } catch {}
            }
            const all = [...new Set([...baseIngredients, ...dish.missing_ingredients])];

            const controller = new AbortController();
            abortRef.current = controller;

            let finalRecipe: GeneratedRecipe | null = null;
            try {
                const finalRaw = await dishesAPI.streamRecipe(
                    dish.title,
                    all,
                    lang,
                    (rawSoFar) => {
                        const partial = tryParsePartial(rawSoFar);
                        if (partial && typeof partial === 'object') {
                            setRecipe(partial as PartialRecipe);
                        }
                    },
                    controller.signal,
                );
                const final = tryParsePartial(finalRaw);
                if (final && typeof final === 'object') {
                    finalRecipe = final as GeneratedRecipe;
                    setRecipe(final as PartialRecipe);
                }
            } catch (streamErr: any) {
                if (streamErr?.name === 'AbortError') return;
                const r = await dishesAPI.generateRecipe(dish.title, all, lang);
                finalRecipe = r;
                setRecipe(r);
            }
            setDone(true);
            if (finalRecipe && isPersistedDish) {
                saveCachedRecipe(dish.id, lang, finalRecipe).catch(() => undefined);
            }
        } catch (error: any) {
            if (error?.name === 'AbortError') return;
            toast.show(error?.response?.data?.detail || error?.message || t('detail.errGenerate'), 'error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            navigation.goBack();
        } finally {
            setStreaming(false);
        }
    };

    const regenerate = async () => {
        if (!isPersistedDish || streaming) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await clearCachedRecipe(dish.id, lang);
        await streamFromApi();
    };

    const checkFavorited = async () => {
        try {
            const list = await favoritesAPI.list();
            setFavored(list.some(f => f.dish_id === dish.id));
        } catch {}
    };

    const toggleFavorite = async () => {
        if (!isPersistedDish) {
            toast.show(t('common.error'), 'error');
            return;
        }
        Haptics.selectionAsync();
        try {
            if (favored) {
                await favoritesAPI.remove(dish.id);
                setFavored(false);
                toast.show(t('detail.unfavorited'), 'info');
            } else {
                await favoritesAPI.add(dish.id);
                setFavored(true);
                toast.show(t('detail.favorited'), 'success');
            }
        } catch (e: any) {
            toast.show(e?.response?.data?.detail || t('common.error'), 'error');
        }
    };

    const addMissingToShopping = async () => {
        if (dish.missing_ingredients.length === 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await shoppingAPI.addBulk(dish.missing_ingredients.map(tProduct));
            toast.show(t('detail.addedToShopping'), 'success');
        } catch (e: any) {
            toast.show(e?.response?.data?.detail || t('common.error'), 'error');
        }
    };

    if (!recipe || !recipe.title) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>{t('detail.loading')}</Text>
            </View>
        );
    }

    const ingredients = recipe.ingredients ?? [];
    const steps = recipe.steps ?? [];
    const tips = recipe.tips ?? [];
    const cookingTime = recipe.cooking_time;
    const servings = recipe.servings;
    const servingSuggestion = recipe.serving_suggestion;

    const canStartCooking = done && steps.length > 0;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.heroWrap}>
                <Image source={dishImage(dish.title)} style={styles.hero} resizeMode="cover" />
                {isPersistedDish ? (
                    <TouchableOpacity onPress={toggleFavorite} hitSlop={10} style={styles.heartButton}>
                        <Ionicons
                            name={favored ? 'heart' : 'heart-outline'}
                            size={26}
                            color={theme.colors.primary}
                        />
                    </TouchableOpacity>
                ) : null}
            </View>
            <View style={styles.section}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{recipe.title}</Text>
                </View>
                {(cookingTime || servings) ? (
                    <View style={styles.badges}>
                        {cookingTime ? (
                            <View style={styles.badge}>
                                <Ionicons name="time-outline" size={14} color={theme.colors.text} />
                                <Text style={styles.badgeText}>{cookingTime}</Text>
                            </View>
                        ) : null}
                        {servings ? (
                            <View style={styles.badge}>
                                <Ionicons name="people-outline" size={14} color={theme.colors.text} />
                                <Text style={styles.badgeText}>{servings}</Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}
                {streaming ? (
                    <View style={styles.streamingBadge}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text style={styles.streamingText}>{t('detail.loading')}</Text>
                    </View>
                ) : fromCache && isPersistedDish ? (
                    <View style={styles.streamingBadge}>
                        <Ionicons name="bookmark" size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.streamingText}>{t('detail.cachedHint')}</Text>
                    </View>
                ) : null}
            </View>

            {ingredients.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('detail.ingredients')}</Text>
                    {ingredients.map((ing, index) => (
                        <View key={index} style={styles.row}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.text}>{ing}</Text>
                        </View>
                    ))}
                    {dish.missing_ingredients.length > 0 ? (
                        <View style={styles.missingRow}>
                            <Text style={styles.missingNote}>
                                {t('detail.missing', { items: dish.missing_ingredients.map(tProduct).join(', ') })}
                            </Text>
                            <Button
                                title={`+ ${t('detail.addToShopping')}`}
                                onPress={addMissingToShopping}
                                variant="outline"
                                size="small"
                                style={{ marginTop: theme.spacing.s }}
                            />
                        </View>
                    ) : null}
                </View>
            ) : null}

            {steps.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('detail.steps')}</Text>
                    {steps.map((step, index) => (
                        <AnimatedListItem index={index} delayMs={40} key={index}>
                            <View style={styles.step}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                                </View>
                                <Text style={styles.text}>{step}</Text>
                            </View>
                        </AnimatedListItem>
                    ))}
                </View>
            ) : null}

            {tips.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('detail.tips')}</Text>
                    {tips.map((tip, index) => (
                        <View key={index} style={styles.tipRow}>
                            <Ionicons name="bulb-outline" size={18} color={theme.colors.primary} style={{ marginTop: 2 }} />
                            <Text style={[styles.text, { marginLeft: theme.spacing.s }]}>{tip}</Text>
                        </View>
                    ))}
                </View>
            ) : null}

            {servingSuggestion ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('detail.servingSuggestion')}</Text>
                    <Text style={styles.text}>{servingSuggestion}</Text>
                </View>
            ) : null}

            <View style={styles.footer}>
                <Button
                    title={t('detail.startCook')}
                    disabled={!canStartCooking}
                    loading={streaming}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        navigation.navigate('CookingMode', {
                            steps,
                            dishId: dish.id,
                            recipeName: recipe.title,
                            imageUri,
                        });
                    }}
                />
                {isPersistedDish && done && !streaming ? (
                    <Button
                        title={t('detail.regenerate')}
                        onPress={regenerate}
                        variant="outline"
                        size="small"
                        style={{ marginTop: theme.spacing.s }}
                    />
                ) : null}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    heroWrap: {
        height: 220,
        position: 'relative',
        backgroundColor: theme.colors.surface,
    },
    hero: {
        width: '100%',
        height: '100%',
    },
    heartButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: theme.colors.background,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.85,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.l,
    },
    loadingText: { ...theme.typography.body },
    content: { paddingBottom: 40 },
    section: {
        padding: theme.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.m },
    title: { ...theme.typography.h1, flex: 1, marginRight: theme.spacing.m },
    badges: { flexDirection: 'row', gap: theme.spacing.m },
    badge: {
        backgroundColor: theme.colors.surface,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: theme.borderRadius.round,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    badgeText: { color: theme.colors.text, fontWeight: '600', fontSize: 13 },
    streamingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: theme.spacing.m,
        paddingHorizontal: 4,
    },
    streamingText: { color: theme.colors.textSecondary, fontSize: 13 },
    sectionTitle: { ...theme.typography.h2, fontSize: 20, marginBottom: theme.spacing.m },
    row: { flexDirection: 'row', marginBottom: theme.spacing.s },
    bullet: { color: theme.colors.primary, marginRight: theme.spacing.s, fontSize: 18 },
    text: { ...theme.typography.body, flex: 1, lineHeight: 22 },
    missingRow: { marginTop: theme.spacing.m },
    missingNote: { ...theme.typography.caption, color: theme.colors.textSecondary, fontSize: 13, textTransform: 'none' as const },
    step: { flexDirection: 'row', marginBottom: theme.spacing.l },
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
    stepNumberText: { color: theme.colors.onPrimary, fontWeight: 'bold', fontSize: 14 },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.m,
    },
    footer: { padding: theme.spacing.l },
});
