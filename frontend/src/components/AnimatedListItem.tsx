import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, Easing } from 'react-native';

interface Props {
    index?: number;
    children: React.ReactNode;
    style?: ViewStyle;
    delayMs?: number;
}

export const AnimatedListItem: React.FC<Props> = ({ index = 0, children, style, delayMs = 50 }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const initialIndex = useRef(index);
    const initialDelay = useRef(delayMs);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 320,
                delay: initialIndex.current * initialDelay.current,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 320,
                delay: initialIndex.current * initialDelay.current,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();
    }, [opacity, translateY]);

    return (
        <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
            {children}
        </Animated.View>
    );
};
