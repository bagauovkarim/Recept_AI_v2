import * as FileSystem from 'expo-file-system/legacy';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

async function ensureDir(): Promise<void> {
    const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
    }
}

export async function persistPhoto(srcUri: string | undefined | null): Promise<string | null> {
    if (!srcUri) return null;
    try {
        if (srcUri.startsWith(PHOTOS_DIR)) return srcUri;

        await ensureDir();
        const ext = (srcUri.split('.').pop() || 'jpg').split('?')[0].slice(0, 5);
        const safeExt = /^[a-zA-Z0-9]+$/.test(ext) ? ext : 'jpg';
        const dst = `${PHOTOS_DIR}${Date.now()}-${Math.floor(Math.random() * 1e6)}.${safeExt}`;
        await FileSystem.copyAsync({ from: srcUri, to: dst });
        return dst;
    } catch {
        return srcUri;
    }
}
