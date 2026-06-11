import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeneratedRecipe } from './api';

const CACHE_VERSION = 1;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry {
    v: number;
    savedAt: number;
    recipe: GeneratedRecipe;
}

function key(dishId: number, lang: string): string {
    return `recipe_cache:v${CACHE_VERSION}:${dishId}:${lang}`;
}

export async function getCachedRecipe(dishId: number, lang: string): Promise<GeneratedRecipe | null> {
    if (dishId <= 0) return null;
    try {
        const raw = await AsyncStorage.getItem(key(dishId, lang));
        if (!raw) return null;
        const entry = JSON.parse(raw) as CacheEntry;
        if (entry.v !== CACHE_VERSION) return null;
        if (Date.now() - entry.savedAt > TTL_MS) {
            AsyncStorage.removeItem(key(dishId, lang)).catch(() => undefined);
            return null;
        }
        return entry.recipe;
    } catch {
        return null;
    }
}

export async function saveCachedRecipe(
    dishId: number,
    lang: string,
    recipe: GeneratedRecipe,
): Promise<void> {
    if (dishId <= 0) return;
    if (!recipe.title || !recipe.steps || recipe.steps.length === 0) return;
    const entry: CacheEntry = {
        v: CACHE_VERSION,
        savedAt: Date.now(),
        recipe,
    };
    try {
        await AsyncStorage.setItem(key(dishId, lang), JSON.stringify(entry));
    } catch {}
}

export async function clearCachedRecipe(dishId: number, lang: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(key(dishId, lang));
    } catch {}
}

export async function clearAllCachedRecipes(): Promise<void> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const ours = keys.filter(k => k.startsWith('recipe_cache:'));
        if (ours.length > 0) {
            await AsyncStorage.multiRemove(ours);
        }
    } catch {}
}
