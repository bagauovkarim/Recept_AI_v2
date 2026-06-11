import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { useToast } from '../../components/Toast';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const { t } = useI18n();
    const toast = useToast();

    const handleLogin = async () => {
        if (!email || !password) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            toast.show(t('auth.errEmptyFields'), 'error');
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const detail = error?.response?.data?.detail;
            toast.show(detail || t('auth.errLogin'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Text style={styles.logo}>🍳 {t('auth.appName')}</Text>
                    <Text style={styles.title}>{t('auth.welcome')}</Text>
                    <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder={t('auth.email')}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder={t('auth.password')}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Button
                        title={t('auth.login')}
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.button}
                    />

                    <Button
                        title={t('auth.noAccount')}
                        onPress={() => navigation.navigate('Register')}
                        variant="ghost"
                        style={styles.linkButton}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        padding: theme.spacing.l,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    logo: {
        fontSize: 40,
        marginBottom: theme.spacing.m,
    },
    title: {
        ...theme.typography.h1,
        marginBottom: theme.spacing.s,
        textAlign: 'center',
    },
    subtitle: {
        ...theme.typography.body,
        textAlign: 'center',
    },
    form: {
        gap: theme.spacing.m,
    },
    input: {
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        fontSize: 16,
    },
    button: {
        marginTop: theme.spacing.s,
    },
    linkButton: {
        marginTop: theme.spacing.s,
    },
});
