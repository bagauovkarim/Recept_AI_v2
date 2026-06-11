import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { theme } from '../theme';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    style?: ViewStyle;
    borderRadius?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    style,
    borderRadius = 0,
}) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();

        return () => loop.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, opacity, borderRadius } as any,
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: theme.colors.surface,
        marginBottom: theme.spacing.s,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
});
