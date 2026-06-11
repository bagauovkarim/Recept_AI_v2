import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, onUnauthorized } from '../services/api';
import { clearAllCachedRecipes } from '../services/recipeCache';

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
    refreshUser: () => Promise<void>;
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

        const unsubscribe = onUnauthorized(() => {
            setUser(null);
        });
        return unsubscribe;
    }, []);

    const login = async (email: string, password: string) => {
        const data = await authAPI.login(email, password);
        await AsyncStorage.setItem('token', data.access_token);
        const userData = await authAPI.getMe();
        setUser(userData);
    };

    const register = async (email: string, password: string) => {
        const data = await authAPI.register(email, password);
        await AsyncStorage.setItem('token', data.access_token);
        const userData = await authAPI.getMe();
        setUser(userData);
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await clearAllCachedRecipes();
        setUser(null);
    };

    const refreshUser = async () => {
        const userData = await authAPI.getMe();
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, register, refreshUser }}>
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
