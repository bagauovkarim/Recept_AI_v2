import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { Alert } from 'react-native';

interface User {
    id: number;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    const userData = await authAPI.getMe();
                    setUser(userData);
                }
            } catch (error) {
                await AsyncStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const data = await authAPI.login(email, password);
            await AsyncStorage.setItem('token', data.access_token);
            const userData = await authAPI.getMe();
            setUser(userData);
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Ошибка входа';
            Alert.alert('Ошибка', message);
            throw error;
        }
    };

    const register = async (email: string, password: string) => {
        try {
            const data = await authAPI.register(email, password);
            await AsyncStorage.setItem('token', data.access_token);
            const userData = await authAPI.getMe();
            setUser(userData);
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Ошибка регистрации';
            Alert.alert('Ошибка', message);
            throw error;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
