import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ru } from './locales/ru';
import { en } from './locales/en';
import { translateProduct } from './products';
import { translateDish } from './dishes';
import { setErrorLang } from './errorMap';

export type Lang = 'ru' | 'en';

const TRANSLATIONS = { ru, en };
const STORAGE_KEY = 'app_language';

type TranslationDict = typeof ru;

interface I18nContextType {
    lang: Lang;
    setLang: (l: Lang) => Promise<void>;
    t: (path: string, vars?: Record<string, string | number>) => string;
    tProduct: (technicalName: string) => string;
    tDish: (title: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
    if (!vars) return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{{${k}}}`));
}

export const I18nProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLangState] = useState<Lang>('ru');

    useEffect(() => {
        (async () => {
            const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as Lang | null;
            if (stored === 'ru' || stored === 'en') {
                setLangState(stored);
                setErrorLang(stored);
            }
        })();
    }, []);

    const setLang = async (l: Lang) => {
        setLangState(l);
        setErrorLang(l);
        await AsyncStorage.setItem(STORAGE_KEY, l);
    };

    const t = (path: string, vars?: Record<string, string | number>) => {
        const dict: TranslationDict = TRANSLATIONS[lang];
        const value = getByPath(dict, path);
        if (typeof value === 'string') return interpolate(value, vars);
        return path;
    };

    const tProduct = (technicalName: string) => translateProduct(technicalName, lang);
    const tDish = (title: string) => translateDish(title, lang);

    return (
        <I18nContext.Provider value={{ lang, setLang, t, tProduct, tDish }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useI18n must be used within I18nProvider');
    return ctx;
};
