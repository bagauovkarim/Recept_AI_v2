import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const [notifications, setNotifications] = useState(true);

    const handleLogout = () => {
        Alert.alert(
            'ВЫХОД',
            'ВЫЙТИ ИЗ АККАУНТА?',
            [
                { text: 'ОТМЕНА', style: 'cancel' },
                { text: 'ВЫЙТИ', style: 'destructive', onPress: logout },
            ]
        );
    };

    const renderSettingItem = (label: string, value: boolean, onValueChange: (val: boolean) => void) => (
        <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={value ? '#000' : '#fff'}
                ios_backgroundColor={theme.colors.border}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.name}>{user?.name?.toUpperCase() || 'ПОЛЬЗОВАТЕЛЬ'}</Text>
                <Text style={styles.email}>{user?.email?.toUpperCase() || 'EMAIL@EXAMPLE.COM'}</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>НАСТРОЙКИ</Text>
                    {renderSettingItem('УВЕДОМЛЕНИЯ', notifications, setNotifications)}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>АККАУНТ</Text>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>ИЗМЕНИТЬ ПРОФИЛЬ</Text>
                        <Text style={styles.chevron}>→</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>ПОМОЩЬ</Text>
                        <Text style={styles.chevron}>→</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Button
                        title="ВЫЙТИ"
                        onPress={handleLogout}
                        variant="outline"
                        style={styles.logoutButton}
                    />
                    <Text style={styles.version}>V 1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    avatar: {
        width: 100,
        height: 100,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.m,
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    avatarText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#000',
    },
    name: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.xs,
    },
    email: {
        ...theme.typography.caption,
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: theme.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        ...theme.typography.h3,
        fontSize: 20,
        color: theme.colors.text,
        marginBottom: theme.spacing.l,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    settingLabel: {
        ...theme.typography.body,
        fontSize: 18,
        fontWeight: '600',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    menuItemText: {
        ...theme.typography.body,
        fontSize: 18,
        fontWeight: '600',
    },
    chevron: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    footer: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    logoutButton: {
        width: '100%',
    },
    version: {
        marginTop: theme.spacing.m,
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
    },
});
