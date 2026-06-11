import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';

export default function EditProfileScreen() {
    const { user, refreshUser } = useAuth();
    const { t } = useI18n();
    const toast = useToast();

    const [newEmail, setNewEmail] = useState('');
    const [emailPassword, setEmailPassword] = useState('');
    const [savingEmail, setSavingEmail] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    const saveEmail = async () => {
        if (!newEmail.trim() || !emailPassword) {
            toast.show(t('editProfile.errFillFields'), 'error');
            return;
        }
        if (newEmail.trim() === user?.email) {
            toast.show(t('editProfile.errSameEmail'), 'error');
            return;
        }
        setSavingEmail(true);
        try {
            await authAPI.changeEmail(newEmail.trim(), emailPassword);
            await refreshUser();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.show(t('editProfile.emailUpdated'), 'success');
            setEmailPassword('');
            setNewEmail('');
        } catch (e: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.show(e?.response?.data?.detail || t('common.error'), 'error');
        } finally {
            setSavingEmail(false);
        }
    };

    const savePassword = async () => {
        if (!currentPassword || !newPassword) {
            toast.show(t('editProfile.errFillFields'), 'error');
            return;
        }
        if (newPassword.length < 6) {
            toast.show(t('auth.errPasswordShort'), 'error');
            return;
        }
        setSavingPassword(true);
        try {
            const tok = await authAPI.changePassword(currentPassword, newPassword);
            await AsyncStorage.setItem('token', tok.access_token);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.show(t('editProfile.passwordUpdated'), 'success');
            setCurrentPassword('');
            setNewPassword('');
        } catch (e: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.show(e?.response?.data?.detail || t('common.error'), 'error');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('auth.email')}</Text>
                        <Text style={styles.label}>{t('editProfile.currentEmail')}</Text>
                        <Text style={styles.currentValue}>{user?.email || ''}</Text>

                        <TextInput
                            style={styles.input}
                            placeholder={t('editProfile.newEmail')}
                            placeholderTextColor={theme.colors.textSecondary}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('auth.password')}
                            placeholderTextColor={theme.colors.textSecondary}
                            value={emailPassword}
                            onChangeText={setEmailPassword}
                            secureTextEntry
                        />
                        <Button title={t('editProfile.saveEmail')} onPress={saveEmail} loading={savingEmail} />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('auth.password')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('editProfile.currentPassword')}
                            placeholderTextColor={theme.colors.textSecondary}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('editProfile.newPassword')}
                            placeholderTextColor={theme.colors.textSecondary}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />
                        <Button title={t('editProfile.savePassword')} onPress={savePassword} loading={savingPassword} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.l, gap: theme.spacing.l },
    section: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.l,
        borderRadius: theme.borderRadius.l,
        gap: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    sectionTitle: { ...theme.typography.h3, marginBottom: theme.spacing.xs },
    label: { ...theme.typography.caption, color: theme.colors.textSecondary, fontSize: 11 },
    currentValue: { ...theme.typography.body, color: theme.colors.text, marginBottom: theme.spacing.s },
    input: {
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
});
