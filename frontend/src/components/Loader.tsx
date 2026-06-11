import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Animated, Easing } from 'react-native';
import { theme } from '../theme';

interface LoaderProps {
    visible: boolean;
    text?: string;
}

export const Loader: React.FC<LoaderProps> = ({ visible, text }) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
        }).start();
    }, [visible, opacity]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { opacity }]} pointerEvents={visible ? 'auto' : 'none'}>
            <View style={styles.content}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                {text && <Text style={styles.text}>{text}</Text>}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        elevation: 9999,
    },
    content: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.l,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        minWidth: 150,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    text: {
        ...theme.typography.body,
        marginTop: theme.spacing.m,
        color: theme.colors.text,
    },
});
