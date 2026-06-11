import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { productsAPI, DetectedProduct } from '../services/api';
import { Loader } from '../components/Loader';
import { AnimatedListItem } from '../components/AnimatedListItem';
import { useI18n } from '../i18n';
import { resolveProductId } from '../i18n/products';
import { useToast } from '../components/Toast';

interface ProductItem extends DetectedProduct {
    key: string;
    manual?: boolean;
}

function confidenceTone(c: number): { color: string; labelKey: string } {
    if (c >= 0.8) return { color: theme.colors.success, labelKey: 'recognized.confidenceHigh' };
    if (c >= 0.5) return { color: theme.colors.warning, labelKey: 'recognized.confidenceMid' };
    return { color: theme.colors.error, labelKey: 'recognized.confidenceLow' };
}

export default function RecognizedProductsScreen({ navigation, route }: any) {
    const { imageUri } = route.params;
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [manualInput, setManualInput] = useState('');
    const { t, tProduct } = useI18n();
    const toast = useToast();

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const detected = await productsAPI.detect(imageUri);
                if (!mounted) return;
                const items: ProductItem[] = detected.map((p, i) => ({ ...p, key: `${p.name}-${i}` }));
                setProducts(items);
                if (items.length > 0) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            } catch (error: any) {
                if (!mounted) return;
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                toast.show(error?.response?.data?.detail || t('recognized.errFetch'), 'error');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const removeProduct = (key: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setProducts(prev => prev.filter(p => p.key !== key));
    };

    const addManual = () => {
        const raw = manualInput.trim();
        if (!raw) return;
        const technical = resolveProductId(raw);
        if (products.some(p => p.name.toLowerCase() === technical)) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setManualInput('');
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setProducts(prev => [
            { name: technical, confidence: 1.0, key: `manual-${Date.now()}`, manual: true },
            ...prev,
        ]);
        setManualInput('');
    };

    const handleGenerateRecipes = () => {
        if (products.length === 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            toast.show(t('recognized.emptyAlert'), 'error');
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('RecipeList', { products: products.map(p => p.name), imageUri });
    };

    const renderRightAction = (key: string) => (progress: Animated.AnimatedInterpolation<number>) => {
        const trans = progress.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
        return (
            <Animated.View style={[styles.deleteAction, { transform: [{ translateX: trans }] }]}>
                <Text style={styles.deleteText}>✕</Text>
            </Animated.View>
        );
    };

    const renderItem = ({ item, index }: { item: ProductItem; index: number }) => {
        const tone = confidenceTone(item.confidence);
        return (
            <AnimatedListItem index={index} delayMs={40}>
                <Swipeable
                    renderRightActions={renderRightAction(item.key)}
                    onSwipeableOpen={() => removeProduct(item.key)}
                    rightThreshold={40}
                >
                    <View style={styles.item}>
                        <View style={[styles.dot, { backgroundColor: tone.color }]} />
                        <Text style={styles.itemText}>{tProduct(item.name)}</Text>
                        {item.manual ? (
                            <Text style={styles.itemBadge}>＋</Text>
                        ) : (
                            <View style={styles.confWrap}>
                                <Text style={[styles.confText, { color: tone.color }]}>
                                    {Math.round(item.confidence * 100)}%
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity onPress={() => removeProduct(item.key)} hitSlop={10} style={styles.removeBtn}>
                            <Text style={styles.removeText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                </Swipeable>
            </AnimatedListItem>
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <Loader visible={loading} text={t('recognized.loadingText')} />

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('recognized.title')}</Text>
                        <Text style={styles.subtitle}>
                            {loading ? t('recognized.analyzing') : t('recognized.countFound', { count: products.length })}
                        </Text>
                    </View>

                    <FlatList
                        data={products}
                        keyExtractor={item => item.key}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            !loading ? (
                                <View style={styles.emptyWrap}>
                                    <Text style={styles.emptyEmoji}>🤔</Text>
                                    <Text style={styles.emptyText}>{t('recognized.empty')}</Text>
                                    <Text style={styles.emptyHint}>{t('recognized.emptyAction')}</Text>
                                </View>
                            ) : null
                        }
                    />

                    <View style={styles.manualRow}>
                        <TextInput
                            style={styles.manualInput}
                            placeholder={t('recognized.addPlaceholder')}
                            placeholderTextColor={theme.colors.textSecondary}
                            value={manualInput}
                            onChangeText={setManualInput}
                            onSubmitEditing={addManual}
                            returnKeyType="done"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={addManual} style={styles.manualButton}>
                            <Text style={styles.manualButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Button
                            title={t('recognized.cta')}
                            onPress={handleGenerateRecipes}
                            disabled={products.length === 0 || loading}
                        />
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: theme.spacing.l },
    title: { ...theme.typography.h2, marginBottom: theme.spacing.xs },
    subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
    list: { paddingHorizontal: theme.spacing.l, paddingBottom: theme.spacing.s, flexGrow: 1 },
    item: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        marginBottom: theme.spacing.s,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    itemText: { ...theme.typography.body, fontSize: 17, fontWeight: '600', flex: 1 },
    itemBadge: { color: theme.colors.primary, fontSize: 18, fontWeight: '900' },
    confWrap: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.s,
        backgroundColor: theme.colors.surfaceAlt,
    },
    confText: { fontSize: 12, fontWeight: '800' },
    removeBtn: { padding: 6 },
    removeText: { color: theme.colors.textSecondary, fontSize: 18 },
    deleteAction: {
        backgroundColor: theme.colors.error,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: theme.spacing.l,
        marginBottom: theme.spacing.s,
        borderRadius: theme.borderRadius.m,
    },
    deleteText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
    emptyWrap: { alignItems: 'center', paddingTop: theme.spacing.xxl },
    emptyEmoji: { fontSize: 56, marginBottom: theme.spacing.m },
    emptyText: { ...theme.typography.h3, marginBottom: theme.spacing.xs },
    emptyHint: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 280 },
    manualRow: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.l,
        paddingTop: theme.spacing.s,
        gap: theme.spacing.s,
    },
    manualInput: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    manualButton: {
        width: 56,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.m,
    },
    manualButtonText: { color: theme.colors.onPrimary, fontSize: 28, fontWeight: '900' },
    footer: { padding: theme.spacing.l },
});
