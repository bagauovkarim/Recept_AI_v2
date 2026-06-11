import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as expoFetch } from 'expo/fetch';
import { localizeBackendError } from '../i18n/errorMap';

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

export interface DishDetail {
    id: number;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients: string[];
}

export interface GeneratedRecipe {
    title: string;
    ingredients: string[];
    steps: string[];
    cooking_time: string;
    servings: string;
    tips?: string[];
    serving_suggestion?: string | null;
}

export interface HistoryEntry {
    id: number;
    dish_id: number;
    dish_title: string | null;
    image_uri: string | null;
    cooked_at: string;
}

export interface FavoriteEntry {
    id: number;
    dish_id: number;
    dish_title: string | null;
    difficulty: 'easy' | 'medium' | 'hard' | null;
    created_at: string;
}

export interface ShoppingItem {
    id: number;
    name: string;
    purchased: boolean;
    created_at: string;
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

type UnauthorizedHandler = () => void | Promise<void>;
const unauthorizedHandlers: UnauthorizedHandler[] = [];

export function onUnauthorized(handler: UnauthorizedHandler): () => void {
    unauthorizedHandlers.push(handler);
    return () => {
        const idx = unauthorizedHandlers.indexOf(handler);
        if (idx >= 0) unauthorizedHandlers.splice(idx, 1);
    };
}

let unauthorizedInFlight: Promise<void> | null = null;

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || '';
        const isAuthEndpoint = url.includes('/auth/');
        if (status === 401 && !isAuthEndpoint) {
            if (!unauthorizedInFlight) {
                unauthorizedInFlight = (async () => {
                    try {
                        await AsyncStorage.removeItem('token');
                        for (const h of unauthorizedHandlers) {
                            try {
                                await h();
                            } catch {}
                        }
                    } finally {
                        setTimeout(() => {
                            unauthorizedInFlight = null;
                        }, 0);
                    }
                })();
            }
            await unauthorizedInFlight;
        }

        const data = error?.response?.data;
        const rawDetail = data?.detail ?? data?.error;
        const localized = error?.response
            ? localizeBackendError(rawDetail, status)
            : localizeBackendError(error?.message, undefined);
        if (error?.response) {
            error.response.data = { ...(data || {}), detail: localized };
        } else {
            error.message = localized;
        }
        return Promise.reject(error);
    },
);

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

    changePassword: async (current_password: string, new_password: string): Promise<AuthToken> => {
        const response = await apiClient.post<AuthToken>('/auth/change-password', { current_password, new_password });
        return response.data;
    },

    changeEmail: async (new_email: string, password: string): Promise<User> => {
        const response = await apiClient.post<User>('/auth/change-email', { new_email, password });
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

    getDetail: async (id: number): Promise<DishDetail> => {
        const response = await apiClient.get<DishDetail>(`/dishes/${id}`);
        return response.data;
    },

    generateRecipe: async (dish_title: string, ingredients: string[], lang: string = 'ru'): Promise<GeneratedRecipe> => {
        const response = await apiClient.post<GeneratedRecipe>('/generate-recipe', {
            dish_title,
            ingredients,
            lang,
        });
        return response.data;
    },

    generateFreeForm: async (ingredients: string[], lang: string = 'ru'): Promise<GeneratedRecipe> => {
        const response = await apiClient.post<GeneratedRecipe>('/generate-freeform-recipe', {
            ingredients,
            lang,
        });
        return response.data;
    },

    streamRecipe: async (
        dish_title: string,
        ingredients: string[],
        lang: string,
        onChunk: (rawJsonSoFar: string) => void,
        signal?: AbortSignal,
    ): Promise<string> => streamSse(
        '/generate-recipe/stream',
        { dish_title, ingredients, lang },
        onChunk,
        signal,
    ),

    streamFreeForm: async (
        ingredients: string[],
        lang: string,
        onChunk: (rawJsonSoFar: string) => void,
        signal?: AbortSignal,
    ): Promise<string> => streamSse(
        '/generate-freeform-recipe/stream',
        { ingredients, lang },
        onChunk,
        signal,
    ),
};

async function streamSse(
    path: string,
    body: Record<string, unknown>,
    onChunk: (rawJsonSoFar: string) => void,
    signal?: AbortSignal,
): Promise<string> {
    const token = await AsyncStorage.getItem('token');
    const response = await expoFetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal,
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${detail || response.statusText}`);
    }
    if (!response.body) {
        throw new Error('Streaming not supported in this environment');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulated = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep = buffer.indexOf('\n\n');
        while (sep !== -1) {
            const rawEvent = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            sep = buffer.indexOf('\n\n');

            const line = rawEvent.split('\n').find(l => l.startsWith('data: '));
            if (!line) continue;
            const payload = line.slice(6);
            let evt: any;
            try {
                evt = JSON.parse(payload);
            } catch {
                continue;
            }
            if (evt.error) {
                throw new Error(evt.error);
            }
            if (evt.delta) {
                accumulated += evt.delta;
                onChunk(accumulated);
            }
        }
    }

    return accumulated;
}

export const historyAPI = {
    create: async (dish_id: number, image_uri?: string): Promise<HistoryEntry> => {
        const response = await apiClient.post<HistoryEntry>('/history', { dish_id, image_uri });
        return response.data;
    },

    getAll: async (): Promise<HistoryEntry[]> => {
        const response = await apiClient.get<HistoryEntry[]>('/history');
        return response.data;
    },

    delete: async (entry_id: number): Promise<void> => {
        await apiClient.delete(`/history/${entry_id}`);
    },
};

export const favoritesAPI = {
    list: async (): Promise<FavoriteEntry[]> => {
        const response = await apiClient.get<FavoriteEntry[]>('/favorites');
        return response.data;
    },

    add: async (dish_id: number): Promise<FavoriteEntry> => {
        const response = await apiClient.post<FavoriteEntry>('/favorites', { dish_id });
        return response.data;
    },

    remove: async (dish_id: number): Promise<void> => {
        await apiClient.delete(`/favorites/${dish_id}`);
    },
};

export const shoppingAPI = {
    list: async (): Promise<ShoppingItem[]> => {
        const response = await apiClient.get<ShoppingItem[]>('/shopping-list');
        return response.data;
    },

    add: async (name: string): Promise<ShoppingItem> => {
        const response = await apiClient.post<ShoppingItem>('/shopping-list', { name });
        return response.data;
    },

    addBulk: async (names: string[]): Promise<ShoppingItem[]> => {
        const response = await apiClient.post<ShoppingItem[]>('/shopping-list/bulk', { names });
        return response.data;
    },

    update: async (id: number, purchased: boolean): Promise<ShoppingItem> => {
        const response = await apiClient.patch<ShoppingItem>(`/shopping-list/${id}`, { purchased });
        return response.data;
    },

    remove: async (id: number): Promise<void> => {
        await apiClient.delete(`/shopping-list/${id}`);
    },

    clearPurchased: async (): Promise<void> => {
        await apiClient.delete('/shopping-list/purchased/all');
    },
};
