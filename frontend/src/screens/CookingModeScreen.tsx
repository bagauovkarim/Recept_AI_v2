import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { historyAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function CookingModeScreen({ route, navigation }: any) {
    const { steps, dishId, recipeName } = route.params as { steps: string[]; dishId: number; recipeName: string };
    const [currentStep, setCurrentStep] = useState(0);
    const [saving, setSaving] = useState(false);

    const finish = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await historyAPI.create(dishId);
        } catch (error: any) {
            Alert.alert('Внимание', 'Не удалось записать в историю, но блюдо приготовлено!');
        } finally {
            setSaving(false);
            navigation.navigate('Main', { screen: 'History' });
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            finish();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.recipeName} numberOfLines={1}>{recipeName}</Text>
                <Text style={styles.stepIndicator}>{currentStep + 1} / {steps.length}</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.stepText}>{steps[currentStep]}</Text>
            </View>

            <View style={styles.footer}>
                <Button
                    title="◄ НАЗАД"
                    onPress={handlePrev}
                    disabled={currentStep === 0}
                    variant="secondary"
                    style={styles.navButton}
                />
                <Button
                    title={currentStep === steps.length - 1 ? "ГОТОВО! 🎉" : "ДАЛЕЕ ►"}
                    onPress={handleNext}
                    style={[styles.navButton, styles.nextButton]}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        padding: theme.spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    closeButton: {
        padding: 8,
    },
    closeIcon: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    recipeName: {
        ...theme.typography.h3,
        fontSize: 16,
        maxWidth: width * 0.6,
    },
    stepIndicator: {
        ...theme.typography.caption,
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.l,
    },
    stepText: {
        ...theme.typography.h1,
        fontSize: 32,
        textAlign: 'center',
        lineHeight: 40,
    },
    footer: {
        padding: theme.spacing.l,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.m,
    },
    navButton: {
        flex: 1,
    },
    nextButton: {
        backgroundColor: '#FFF',
    },
});
