import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';

// Mock history data
const HISTORY_DATA = [
    {
        id: '1',
        name: 'Салат Капрезе',
        date: 'Сегодня',
        image: 'https://images.unsplash.com/photo-1529312266912-b33cf6227e24?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '2',
        name: 'Паста Карбонара',
        date: 'Вчера',
        image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '3',
        name: 'Омлет с овощами',
        date: '2 дня назад',
        image: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
];

export default function HistoryScreen() {
    const renderItem = ({ item }: { item: typeof HISTORY_DATA[0] }) => (
        <Card style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.content}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.date}>Приготовлено: {item.date}</Text>
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>История</Text>
                <Text style={styles.subtitle}>Ваши кулинарные достижения</Text>
            </View>

            <FlatList
                data={HISTORY_DATA}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
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
        paddingBottom: theme.spacing.m,
    },
    title: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        ...theme.typography.body,
    },
    list: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.xl,
    },
    card: {
        padding: 0,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    image: {
        width: 100,
        height: 100,
    },
    content: {
        flex: 1,
        padding: theme.spacing.m,
        justifyContent: 'center',
    },
    name: {
        ...theme.typography.h3,
        fontSize: 16,
        marginBottom: theme.spacing.s,
    },
    date: {
        ...theme.typography.caption,
    },
});
