import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { useI18n } from '../i18n';
import { ru } from '../i18n/locales/ru';
import { en } from '../i18n/locales/en';

type FaqEntry = (typeof ru.help.faq)[number];

const FAQ_BY_LANG = { ru: ru.help.faq, en: en.help.faq };

export default function HelpScreen() {
    const { t, lang } = useI18n();
    const [openIdx, setOpenIdx] = useState<number | null>(null);

    const faq: FaqEntry[] = FAQ_BY_LANG[lang] as FaqEntry[];

    const toggle = (idx: number) => {
        Haptics.selectionAsync();
        setOpenIdx(openIdx === idx ? null : idx);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{t('help.title')}</Text>
                <Text style={styles.subtitle}>{t('help.subtitle')}</Text>

                <View style={styles.list}>
                    {faq.map((item, idx) => {
                        const isOpen = openIdx === idx;
                        return (
                            <TouchableOpacity
                                key={idx}
                                activeOpacity={0.85}
                                onPress={() => toggle(idx)}
                                style={[styles.item, isOpen && styles.itemOpen]}
                            >
                                <View style={styles.qRow}>
                                    <Text style={styles.q}>{item.q}</Text>
                                    <Text style={styles.chevron}>{isOpen ? '–' : '+'}</Text>
                                </View>
                                {isOpen ? <Text style={styles.a}>{item.a}</Text> : null}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.l },
    title: { ...theme.typography.h2, marginBottom: theme.spacing.xs },
    subtitle: { ...theme.typography.body, color: theme.colors.textSecondary, marginBottom: theme.spacing.l },
    list: { gap: theme.spacing.s },
    item: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    itemOpen: {
        borderColor: theme.colors.primary,
    },
    qRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    q: { ...theme.typography.body, fontWeight: '700', flex: 1, paddingRight: theme.spacing.m },
    chevron: { fontSize: 24, color: theme.colors.primary, fontWeight: '300' },
    a: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.m,
        lineHeight: 22,
    },
});
