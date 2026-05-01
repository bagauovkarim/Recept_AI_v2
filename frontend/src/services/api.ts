import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.162:8000';

export interface DetectedProduct {
    name: string;
    confidence: number;
}

export interface DishOut {
    id: number;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    missing_count: number;
    missing_ingredients: string[];
}

export interface GeneratedRecipe {
    title: string;
    ingredients: string[];
    steps: string[];
    cooking_time: string;
    servings: string;
}

export interface HistoryEntry {
    id: number;
    dish_id: number;
    dish_title: string | null;
    cooked_at: string;
}

export interface User {
    id: number;
    email: string;
}

export interface AuthToken {
    access_token: string;
    token_type: string;
}

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    register: async (email: string, password: string): Promise<AuthToken> => {
        const response = await apiClient.post<AuthToken>('/auth/register', { email, password });
        return response.data;
    },

    login: async (email: string, password: string): Promise<AuthToken> => {
        const response = await apiClient.post<AuthToken>('/auth/login', { email, password });
        return response.data;
    },

    getMe: async (): Promise<User> => {
        const response = await apiClient.get<User>('/auth/me');
        return response.data;
    },
};

export const productsAPI = {
    detect: async (imageUri: string): Promise<DetectedProduct[]> => {
        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'photo.jpg',
        } as any);

        const response = await apiClient.post<DetectedProduct[]>('/detect-products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};

export const dishesAPI = {
    find: async (ingredients: string[]): Promise<DishOut[]> => {
        const response = await apiClient.post<DishOut[]>('/dishes/find', { ingredients });
        return response.data;
    },

    generateRecipe: async (dish_title: string, ingredients: string[]): Promise<GeneratedRecipe> => {
        const response = await apiClient.post<GeneratedRecipe>('/generate-recipe', {
            dish_title,
            ingredients,
        });
        return response.data;
    },
};

export const historyAPI = {
    create: async (dish_id: number): Promise<HistoryEntry> => {
        const response = await apiClient.post<HistoryEntry>('/history', { dish_id });
        return response.data;
    },

    getAll: async (): Promise<HistoryEntry[]> => {
        const response = await apiClient.get<HistoryEntry[]>('/history');
        return response.data;
    },
};
