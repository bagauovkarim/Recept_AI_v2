import React, { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { Animated, StyleSheet, Text, View, Easing } from 'react-native';
import { theme } from '../theme';

type ToastKind = 'info' | 'success' | 'error';

interface ToastState {
    visible: boolean;
    message: string;
    kind: ToastKind;
}

interface ToastContextType {
    show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<ToastState>({ visible: false, message: '', kind: 'info' });
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-30)).current;
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback((message: string, kind: ToastKind = 'info') => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setState({ visible: true, message, kind });
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
            Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        ]).start();

        hideTimer.current = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: -30, duration: 200, useNativeDriver: true }),
            ]).start(() => {
                setState(s => ({ ...s, visible: false }));
            });
        }, 2400);
    }, [opacity, translateY]);

    const accent = state.kind === 'error'
        ? theme.colors.error
        : state.kind === 'success'
        ? theme.colors.primary
        : theme.colors.textSecondary;

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            {state.visible && (
                <Animated.View
                    pointerEvents="none"
                    style={[styles.wrap, { opacity, transform: [{ translateY }] }]}
                >
                    <View style={[styles.toast, { borderColor: accent }]}>
                        <Text style={styles.text}>{state.message}</Text>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 9999,
        alignItems: 'center',
    },
    toast: {
        backgroundColor: theme.colors.surface,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: theme.borderRadius.m,
        borderWidth: 2,
        maxWidth: '100%',
    },
    text: {
        ...theme.typography.body,
        color: theme.colors.text,
        textAlign: 'center',
    },
});
