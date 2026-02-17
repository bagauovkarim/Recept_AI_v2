import React, { useRef } from 'react';
import { Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Animated, Pressable } from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
}) => {
    // Use standard Animated API
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 50,
            bounciness: 10,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 10,
        }).start();
    };

    const getBackgroundColor = () => {
        if (disabled) return theme.colors.border;
        switch (variant) {
            case 'secondary': return theme.colors.secondary;
            case 'outline': return 'transparent';
            default: return theme.colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.colors.textSecondary;
        switch (variant) {
            case 'secondary': return theme.colors.text;
            case 'outline': return theme.colors.primary;
            default: return '#000000';
        }
    };

    const getBorder = () => {
        if (variant === 'outline') return { borderWidth: 2, borderColor: theme.colors.primary };
        return {};
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            style={[style]} // Pass external style to Pressable wrapper
        >
            <Animated.View
                style={[
                    styles.button,
                    {
                        backgroundColor: getBackgroundColor(),
                        transform: [{ scale: scaleAnim }]
                    },
                    getBorder(),
                ]}
            >
                {loading ? (
                    <ActivityIndicator color={variant === 'primary' ? '#000' : '#FFF'} />
                ) : (
                    <>
                        {icon}
                        <Text style={[styles.text, { color: getTextColor(), marginLeft: icon ? 8 : 0 }, textStyle]}>
                            {title}
                        </Text>
                    </>
                )}
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: theme.spacing.m + 4,
        paddingHorizontal: theme.spacing.l,
        borderRadius: 0, // Rectangular
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    text: {
        ...theme.typography.button,
    },
});
