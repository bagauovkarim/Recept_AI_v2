export const theme = {
    colors: {
        background: '#000000', // True Black
        surface: '#1A1A1A',     // Dark Grey for variety
        primary: '#FFFFFF',     // White
        secondary: '#333333',   // Dark Grey
        text: '#FFFFFF',        // White Text
        textSecondary: '#888888', // Grey Text
        border: '#333333',
        success: '#FFFFFF',     // Keep monochrome where possible
        error: '#FFFFFF',
        overlay: 'rgba(0,0,0,0.9)',
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        s: 0,   // Sharp corners
        m: 4,   // Slightly rounded
        l: 8,
        round: 9999, // For avatars only
    },
    typography: {
        h1: {
            fontSize: 36,
            fontWeight: '900' as const,
            color: '#FFFFFF',
            letterSpacing: 1,
            textTransform: 'uppercase' as const,
        },
        h2: {
            fontSize: 24,
            fontWeight: '800' as const,
            color: '#FFFFFF',
            textTransform: 'uppercase' as const,
        },
        h3: {
            fontSize: 18,
            fontWeight: '700' as const,
            color: '#FFFFFF',
            textTransform: 'uppercase' as const,
        },
        body: {
            fontSize: 16,
            fontWeight: '500' as const,
            color: '#FFFFFF',
        },
        caption: {
            fontSize: 12,
            fontWeight: '400' as const,
            color: '#888888',
            textTransform: 'uppercase' as const,
        },
        button: {
            fontSize: 18,
            fontWeight: '800' as const,
            color: '#000000',
            textTransform: 'uppercase' as const,
            letterSpacing: 1,
        },
    }
};
