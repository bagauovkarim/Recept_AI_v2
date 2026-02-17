import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal, Text } from 'react-native';
import { theme } from '../theme';
import { BlurView } from 'expo-blur';

interface LoaderProps {
    visible: boolean;
    text?: string;
}

export const Loader: React.FC<LoaderProps> = ({ visible, text }) => {
    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    {text && <Text style={styles.text}>{text}</Text>}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.l,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        minWidth: 150,
    },
    text: {
        ...theme.typography.body,
        marginTop: theme.spacing.m,
        color: theme.colors.text,
    },
});
