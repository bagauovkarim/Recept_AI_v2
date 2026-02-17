import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Ошибка', 'Введите email и пароль');
            return;
        }
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        login(email);
        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Text style={styles.logo}>🍳 ReceptAI</Text>
                    <Text style={styles.title}>Добро пожаловать!</Text>
                    <Text style={styles.subtitle}>Войдите, чтобы продолжить</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Пароль"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Button
                        title="Войти"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.button}
                    />

                    <Button
                        title="Нет аккаунта? Регистрация"
                        onPress={() => navigation.navigate('Register')}
                        variant="outline"
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
        borderWidth: 0,
    },
});
