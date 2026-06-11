const ACCENT = '#FF6A00';

const colors = {
    background: '#000000',
    surface: '#1A1A1A',
    surfaceAlt: '#222222',
    primary: ACCENT,
    onPrimary: '#000000',
    secondary: '#333333',
    text: '#FFFFFF',
    textSecondary: '#888888',
    border: '#333333',
    success: '#4ADE80',
    warning: '#FACC15',
    error: '#F87171',
    overlay: 'rgba(0,0,0,0.85)',
    white: '#FFFFFF',
    black: '#000000',
};

export const theme = {
    colors,
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        s: 4,
        m: 12,
        l: 20,
        round: 9999,
    },
    typography: {
        h1: {
            fontSize: 36,
            fontWeight: '900' as const,
            color: colors.text,
            letterSpacing: 0.5,
        },
        h2: {
            fontSize: 24,
            fontWeight: '800' as const,
            color: colors.text,
            letterSpacing: 0.3,
        },
        h3: {
            fontSize: 18,
            fontWeight: '700' as const,
            color: colors.text,
        },
        body: {
            fontSize: 16,
            fontWeight: '500' as const,
            color: colors.text,
        },
        caption: {
            fontSize: 12,
            fontWeight: '500' as const,
            color: colors.textSecondary,
            letterSpacing: 1,
            textTransform: 'uppercase' as const,
        },
        button: {
            fontSize: 16,
            fontWeight: '700' as const,
            color: colors.onPrimary,
            letterSpacing: 0.5,
        },
    },
};
