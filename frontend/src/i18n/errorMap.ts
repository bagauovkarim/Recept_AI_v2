import { ru } from './locales/ru';
import { en } from './locales/en';

export type Lang = 'ru' | 'en';

let currentLang: Lang = 'ru';

export function setErrorLang(lang: Lang) {
    currentLang = lang;
}

function dict() {
    return (currentLang === 'en' ? en : ru).errors;
}

type BackendDetail = unknown;

function pickFromArray(detail: unknown[]): string | undefined {
    const first = detail[0] as { msg?: unknown } | undefined;
    if (first && typeof first.msg === 'string') return first.msg;
    return undefined;
}

function normalize(detail: BackendDetail): string {
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return pickFromArray(detail) ?? '';
    if (detail && typeof detail === 'object') {
        const obj = detail as Record<string, unknown>;
        if (typeof obj.msg === 'string') return obj.msg;
        if (typeof obj.detail === 'string') return obj.detail;
    }
    return '';
}

export function localizeBackendError(detail: BackendDetail, status?: number): string {
    const e = dict();
    const raw = normalize(detail);
    const lower = raw.toLowerCase();

    if (status === 429) return e.rateLimitExceeded;
    if (status === 422) return e.validationFailed;
    if (status === 504) return e.recipeTimeout;

    if (raw.startsWith('Rate limit exceeded')) return e.rateLimitExceeded;

    if (lower.includes('invalid email or password')) return e.invalidCredentials;
    if (lower.includes('user with this email already exists')) return e.emailTaken;
    if (lower.includes('current password is incorrect')) return e.currentPasswordWrong;
    if (lower.includes('password is incorrect')) return e.passwordWrong;
    if (lower.includes('email already in use')) return e.newEmailTaken;

    if (lower.includes('not authenticated')) return e.notAuthenticated;
    if (lower.includes('invalid token') || lower.includes('user not found')) return e.sessionExpired;

    if (lower.includes('файл слишком большой') || lower.includes('file is too large')) return e.fileTooLarge;
    if (lower.includes('поддерживаются только jpeg') || lower.includes('only jpeg')) return e.unsupportedFormat;
    if (lower.includes('не удалось открыть изображение') || lower.includes('could not open image')) return e.brokenImage;

    if (lower.includes('dish not found')) return e.dishNotFound;
    if (lower.includes('item not found')) return e.itemNotFound;

    if (lower.includes('deepseek') && lower.includes('timed out')) return e.recipeTimeout;
    if (lower.includes('deepseek') || lower.includes('recipe generator')) {
        if (lower.includes('non-json') || lower.includes('malformed schema')) return e.recipeMalformed;
        return e.recipeServiceUnavailable;
    }

    if (status === 502 || status === 503) return e.recipeServiceUnavailable;
    if (status === 500) return e.serverError;

    if (raw) return raw;
    return e.unknown;
}

export function localizeNetworkError(err: unknown): string {
    const e = dict();
    const msg = (err as { message?: string })?.message ?? '';
    if (msg.includes('Network Error') || msg.includes('Failed to fetch')) return e.networkError;
    if (msg.startsWith('HTTP ')) {
        const m = msg.match(/^HTTP (\d+):\s*(.*)$/);
        if (m) {
            const status = parseInt(m[1], 10);
            const rest = m[2];
            let parsed: unknown = rest;
            try {
                parsed = JSON.parse(rest);
            } catch {}
            if (parsed && typeof parsed === 'object' && 'detail' in (parsed as object)) {
                return localizeBackendError((parsed as { detail: unknown }).detail, status);
            }
            return localizeBackendError(rest, status);
        }
    }
    return localizeBackendError(msg);
}
