import React, { useRef } from 'react';
import { Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Animated, Pressable } from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
    size?: 'normal' | 'small';
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
    size = 'normal',
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 60,
            bounciness: 8,
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

    const c = theme.colors;
    const getBackgroundColor = () => {
        if (disabled) return c.border;
        switch (variant) {
            case 'secondary': return c.surface;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return c.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return c.textSecondary;
        switch (variant) {
            case 'secondary': return c.text;
            case 'outline': return c.primary;
            case 'ghost': return c.text;
            default: return c.onPrimary;
        }
    };

    const getBorder = () => {
        if (variant === 'outline') return { borderWidth: 2, borderColor: c.primary };
        if (variant === 'secondary') return { borderWidth: 1, borderColor: c.border };
        return {};
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            style={[style]}
        >
            <Animated.View
                style={[
                    styles.button,
                    size === 'small' && styles.buttonSmall,
                    {
                        backgroundColor: getBackgroundColor(),
                        transform: [{ scale: scaleAnim }],
                    },
                    getBorder(),
                ]}
            >
                {loading ? (
                    <ActivityIndicator color={variant === 'primary' ? c.onPrimary : c.text} />
                ) : (
                    <>
                        {icon}
                        <Text
                            style={[
                                styles.text,
                                size === 'small' && styles.textSmall,
                                { color: getTextColor(), marginLeft: icon ? 8 : 0 },
                                textStyle,
                            ]}
                        >
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
        paddingVertical: theme.spacing.m,
        paddingHorizontal: theme.spacing.l,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonSmall: {
        paddingVertical: 10,
        paddingHorizontal: theme.spacing.m,
    },
    text: {
        ...theme.typography.button,
    },
    textSmall: {
        fontSize: 14,
    },
});
