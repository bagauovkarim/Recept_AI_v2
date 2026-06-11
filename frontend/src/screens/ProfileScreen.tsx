import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useI18n, Lang } from '../i18n';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const { t, lang, setLang } = useI18n();
    const nav = useNavigation<any>();

    const handleLogout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            t('profile.logoutTitle'),
            t('profile.logoutMsg'),
            [
                { text: t('profile.logoutCancel'), style: 'cancel' },
                { text: t('profile.logoutConfirm'), style: 'destructive', onPress: logout },
            ]
        );
    };

    const onToggleLang = async (l: Lang) => {
        if (l !== lang) {
            Haptics.selectionAsync();
            await setLang(l);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <Text style={styles.name}>{t('profile.title')}</Text>
                <Text style={styles.email}>{user?.email || ''}</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('profile.sectionLanguage')}</Text>
                    <View style={styles.segmented}>
                        <TouchableOpacity
                            style={[styles.segment, lang === 'ru' && styles.segmentActive]}
                            onPress={() => onToggleLang('ru')}
                        >
                            <Text style={[styles.segmentText, lang === 'ru' && styles.segmentTextActive]}>
                                {t('profile.langRu')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segment, lang === 'en' && styles.segmentActive]}
                            onPress={() => onToggleLang('en')}
                        >
                            <Text style={[styles.segmentText, lang === 'en' && styles.segmentTextActive]}>
                                {t('profile.langEn')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('profile.sectionAccount')}</Text>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => { Haptics.selectionAsync(); nav.navigate('EditProfile'); }}
                    >
                        <Ionicons name="person-circle-outline" size={22} color={theme.colors.text} />
                        <Text style={styles.menuItemText}>{t('profile.editProfile')}</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => { Haptics.selectionAsync(); nav.navigate('Help'); }}
                    >
                        <Ionicons name="help-circle-outline" size={22} color={theme.colors.text} />
                        <Text style={styles.menuItemText}>{t('profile.help')}</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Button title={t('profile.logout')} onPress={handleLogout} variant="outline" style={styles.logoutButton} />
                    <Text style={styles.version}>{t('profile.version')}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        alignItems: 'center',
        paddingTop: theme.spacing.l,
        paddingBottom: theme.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.m,
    },
    avatarText: { fontSize: 32, fontWeight: '900', color: theme.colors.onPrimary },
    name: { ...theme.typography.h2, marginBottom: 4 },
    email: { ...theme.typography.body, color: theme.colors.textSecondary, fontSize: 14 },
    content: { flex: 1 },
    section: {
        paddingHorizontal: theme.spacing.l,
        paddingVertical: theme.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        ...theme.typography.caption,
        fontSize: 11,
        marginBottom: theme.spacing.m,
        color: theme.colors.textSecondary,
    },
    segmented: {
        flexDirection: 'row',
        gap: theme.spacing.s,
    },
    segment: {
        flex: 1,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.m,
        backgroundColor: theme.colors.surface,
    },
    segmentActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    segmentText: { ...theme.typography.body, fontSize: 14, color: theme.colors.textSecondary, fontWeight: '700' },
    segmentTextActive: { color: theme.colors.onPrimary },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
        paddingVertical: 14,
    },
    menuItemText: {
        ...theme.typography.body,
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    footer: {
        padding: theme.spacing.l,
        alignItems: 'center',
    },
    logoutButton: { width: '100%' },
    version: {
        marginTop: theme.spacing.m,
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
});
