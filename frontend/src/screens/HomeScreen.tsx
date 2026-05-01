import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';
import { Button } from '../components/Button';

export default function HomeScreen({ navigation }: any) {
    const [image, setImage] = useState<string | null>(null);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('ОШИБКА', 'НУЖЕН ДОСТУП К ГАЛЕРЕЕ');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('ОШИБКА', 'НУЖЕН ДОСТУП К КАМЕРЕ');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleRecognize = () => {
        if (!image) return;
        navigation.navigate('RecognizedProducts', { imageUri: image });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>RECEPTAI</Text>
                <Text style={styles.subtitle}>ТВОЙ ШЕФ-ПОВАР</Text>
            </View>

            <View style={styles.content}>
                {image ? (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: image }} style={styles.preview} />
                        <Button
                            title="УДАЛИТЬ"
                            onPress={() => setImage(null)}
                            variant="secondary"
                            style={styles.removeButton}
                        />
                    </View>
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>📷</Text>
                        <Text style={styles.placeholderDesc}>СДЕЛАЙ ФОТО ПРОДУКТОВ</Text>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                {!image ? (
                    <>
                        <Button title="СДЕЛАТЬ ФОТО" onPress={takePhoto} style={styles.button} />
                        <Button title="ВЫБРАТЬ ИЗ ГАЛЕРЕИ" onPress={pickImage} variant="secondary" style={styles.button} />
                    </>
                ) : (
                    <Button title="РАСПОЗНАТЬ" onPress={handleRecognize} style={styles.button} />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: theme.spacing.xl,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        ...theme.typography.h1,
        fontSize: 42,
        letterSpacing: 2,
        marginBottom: theme.spacing.s,
    },
    subtitle: {
        ...theme.typography.caption,
        fontSize: 14,
        letterSpacing: 3,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.l,
    },
    previewContainer: {
        width: '100%',
        height: '80%',
        borderWidth: 2,
        borderColor: theme.colors.primary,
        position: 'relative',
    },
    preview: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 2,
        borderColor: theme.colors.background,
    },
    placeholder: {
        width: '100%',
        height: '80%',
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    placeholderText: {
        fontSize: 64,
        marginBottom: theme.spacing.m,
    },
    placeholderDesc: {
        ...theme.typography.h3,
        textAlign: 'center',
        maxWidth: '80%',
    },
    footer: {
        padding: theme.spacing.l,
        gap: theme.spacing.m,
    },
    button: {
        marginBottom: theme.spacing.xs,
    },
});
