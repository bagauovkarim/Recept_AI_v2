import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';

export default function HomeScreen({ navigation }: any) {
    const [image, setImage] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<number>(3 / 4);
    const [box, setBox] = useState<{ w: number; h: number } | null>(null);
    const { t } = useI18n();
    const toast = useToast();

    useEffect(() => {
        if (!image) return;
        Image.getSize(
            image,
            (w, h) => setAspectRatio(w / h),
            () => setAspectRatio(3 / 4),
        );
    }, [image]);

    const onContentLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setBox({ w: width, h: height });
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            toast.show(t('home.permGallery'), 'error');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.85,
        });

        if (!result.canceled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            toast.show(t('home.permCamera'), 'error');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.85,
        });

        if (!result.canceled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setImage(result.assets[0].uri);
        }
    };

    const handleRecognize = () => {
        if (!image) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('RecognizedProducts', { imageUri: image });
    };

    let previewW = 0;
    let previewH = 0;
    if (box && image) {
        const padding = theme.spacing.l * 2;
        const maxW = box.w - padding;
        const maxH = box.h - padding;
        if (aspectRatio >= maxW / maxH) {
            previewW = maxW;
            previewH = maxW / aspectRatio;
        } else {
            previewH = maxH;
            previewW = maxH * aspectRatio;
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('home.title')}</Text>
                <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
            </View>

            <View style={styles.content} onLayout={onContentLayout}>
                {image && box ? (
                    <Image
                        source={{ uri: image }}
                        style={{
                            width: previewW,
                            height: previewH,
                            borderWidth: 2,
                            borderColor: theme.colors.primary,
                        }}
                        resizeMode="cover"
                    />
                ) : !image && box ? (
                    (() => {
                        const padding = theme.spacing.l * 2;
                        const maxW = box.w - padding;
                        const maxH = box.h - padding;
                        const ph = 3 / 4;
                        let w: number;
                        let h: number;
                        if (ph >= maxW / maxH) {
                            w = maxW;
                            h = maxW / ph;
                        } else {
                            h = maxH;
                            w = maxH * ph;
                        }
                        return (
                            <View style={[styles.placeholder, { width: w, height: h }]}>
                                <Text style={styles.placeholderText}>📷</Text>
                                <Text style={styles.placeholderDesc}>{t('home.placeholder')}</Text>
                            </View>
                        );
                    })()
                ) : null}
            </View>

            <View style={styles.footer}>
                {!image ? (
                    <>
                        <Button title={t('home.takePhoto')} onPress={takePhoto} style={styles.button} />
                        <Button title={t('home.pickGallery')} onPress={pickImage} variant="secondary" style={styles.button} />
                    </>
                ) : (
                    <>
                        <Button title={t('home.recognize')} onPress={handleRecognize} style={styles.button} />
                        <Button title={t('home.deletePhoto')} onPress={() => { Haptics.selectionAsync(); setImage(null); }} variant="secondary" style={styles.button} />
                    </>
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
        paddingHorizontal: theme.spacing.l,
        paddingVertical: theme.spacing.m,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        ...theme.typography.h1,
        fontSize: 28,
        letterSpacing: 2,
        marginBottom: 2,
    },
    subtitle: {
        ...theme.typography.caption,
        fontSize: 11,
        letterSpacing: 3,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
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
