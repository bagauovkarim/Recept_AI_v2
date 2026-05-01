import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { productsAPI, DetectedProduct } from '../services/api';
import { Loader } from '../components/Loader';

interface ProductItem extends DetectedProduct {
    key: string;
}

export default function RecognizedProductsScreen({ navigation, route }: any) {
    const { imageUri } = route.params;
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const detected = await productsAPI.detect(imageUri);
            const items: ProductItem[] = detected.map((p, i) => ({ ...p, key: `${p.name}-${i}` }));
            setProducts(items);
        } catch (error: any) {
            const message = error?.response?.data?.detail || 'Не удалось распознать продукты. Проверь, что бэкенд запущен.';
            Alert.alert('Ошибка', message);
        } finally {
            setLoading(false);
        }
    };

    const removeProduct = (key: string) => {
        setProducts(products.filter(p => p.key !== key));
    };

    const handleGenerateRecipes = () => {
        if (products.length === 0) {
            Alert.alert('Внимание', 'Список продуктов пуст');
            return;
        }
        const productNames = products.map(p => p.name);
        navigation.navigate('RecipeList', { products: productNames });
    };

    const renderItem = ({ item }: { item: ProductItem }) => (
        <View style={styles.item}>
            <View style={styles.itemRow}>
                <Text style={styles.itemText}>{item.name}</Text>
                <Text style={styles.itemConfidence}>{Math.round(item.confidence * 100)}%</Text>
            </View>
            <TouchableOpacity onPress={() => removeProduct(item.key)} hitSlop={8}>
                <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Loader visible={loading} text="Анализируем фото..." />

            <View style={styles.header}>
                <Text style={styles.title}>Продукты</Text>
                <Text style={styles.subtitle}>
                    {loading ? 'Распознаём...' : `Найдено: ${products.length}. Убери лишнее, если есть.`}
                </Text>
            </View>

            <FlatList
                data={products}
                keyExtractor={item => item.key}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    !loading ? <Text style={styles.emptyText}>Ничего не найдено</Text> : null
                }
            />

            <View style={styles.footer}>
                <Button
                    title="Сформировать рецепты"
                    onPress={handleGenerateRecipes}
                    disabled={products.length === 0 || loading}
                />
            </View>
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
        padding: theme.spacing.l,
    },
    item: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        marginBottom: theme.spacing.s,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
    },
    itemText: {
        ...theme.typography.h3,
        color: theme.colors.text,
        textTransform: 'capitalize',
    },
    itemConfidence: {
        ...theme.typography.caption,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    removeText: {
        color: theme.colors.error,
        fontSize: 20,
        fontWeight: 'bold',
        padding: 8,
    },
    emptyText: {
        ...theme.typography.body,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    },
    footer: {
        padding: theme.spacing.l,
    },
});
