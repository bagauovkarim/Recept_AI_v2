import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { api } from '../services/api';
import { Loader } from '../components/Loader';

// Types for products
interface Product {
    id: string;
    name: string;
    confidence: number;
}

export default function RecognizedProductsScreen({ navigation, route }: any) {
    const { imageUri } = route.params;
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const detected = await api.detectProducts(imageUri);
            setProducts(detected);
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось загрузить список продуктов');
        } finally {
            setLoading(false);
        }
    };

    const removeProduct = (id: string) => {
        setProducts(products.filter(p => p.id !== id));
    };

    const handleGenerateRecipes = async () => {
        if (products.length === 0) {
            Alert.alert('Внимание', 'Список продуктов пуст');
            return;
        }
        // We navigate to RecipeList and pass the product names
        const productNames = products.map(p => p.name);
        navigation.navigate('RecipeList', { products: productNames });
    };

    const renderItem = ({ item }: { item: Product }) => (
        <View style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
            <TouchableOpacity onPress={() => removeProduct(item.id)}>
                <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Loader visible={loading} text="Анализируем фото..." />

            <View style={styles.header}>
                <Text style={styles.title}>Продукты</Text>
                <Text style={styles.subtitle}>Проверь список распознанных продуктов</Text>
            </View>

            <FlatList
                data={products}
                keyExtractor={item => item.id}
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
                    disabled={products.length === 0}
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
    itemText: {
        ...theme.typography.h3,
        color: theme.colors.text,
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
