import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

import HomeScreen from '../screens/HomeScreen';
import RecognizedProductsScreen from '../screens/RecognizedProductsScreen';
import RecipeListScreen from '../screens/RecipeListScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CookingModeScreen from '../screens/CookingModeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HelpScreen from '../screens/HelpScreen';
import OnboardingScreen, { isOnboardingDone } from '../screens/OnboardingScreen';

import type { DishOut, GeneratedRecipe } from '../services/api';

export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
    RecognizedProducts: { imageUri: string };
    RecipeList: { products: string[]; imageUri?: string };
    RecipeDetail: {
        dish: DishOut;
        userIngredients: string[];
        imageUri?: string;
        useCache?: boolean;
        preGenerated?: GeneratedRecipe;
    };
    CookingMode: { steps: string[]; dishId: number; recipeName: string; imageUri?: string };
    EditProfile: undefined;
    Help: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
}

function MainTabNavigator() {
    const { t } = useI18n();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.border,
                    paddingBottom: 6,
                    paddingTop: 6,
                    height: 64,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarIcon: ({ color, size, focused }) => {
                    const map: Record<string, keyof typeof Ionicons.glyphMap> = {
                        HomeTab: focused ? 'restaurant' : 'restaurant-outline',
                        Favorites: focused ? 'heart' : 'heart-outline',
                        Shopping: focused ? 'cart' : 'cart-outline',
                        History: focused ? 'time' : 'time-outline',
                        Profile: focused ? 'person' : 'person-outline',
                    };
                    const name = map[route.name] || 'ellipse-outline';
                    return <Ionicons name={name} size={size - 2} color={color} />;
                },
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: t('nav.home') }} />
            <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: t('nav.favorites') }} />
            <Tab.Screen name="Shopping" component={ShoppingListScreen} options={{ title: t('nav.shopping') }} />
            <Tab.Screen name="History" component={HistoryScreen} options={{ title: t('nav.history') }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('nav.profile') }} />
        </Tab.Navigator>
    );
}

function SplashScreen() {
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );
}

function RootNavigator() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <SplashScreen />;

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.text,
                headerTitleStyle: { fontWeight: '600' },
                contentStyle: { backgroundColor: theme.colors.background },
                headerShadowVisible: false,
                animation: 'slide_from_right',
                animationDuration: 250,
            }}
        >
            {!isAuthenticated ? (
                <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false, animation: 'fade' }} />
            ) : (
                <>
                    <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false, animation: 'fade' }} />
                    <Stack.Screen
                        name="CookingMode"
                        component={CookingModeScreen}
                        options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }}
                    />
                    <Stack.Screen
                        name="RecognizedProducts"
                        component={RecognizedProductsScreen}
                        options={{ headerShown: false, animation: 'slide_from_bottom' }}
                    />
                    <Stack.Screen name="RecipeList" component={RecipeListScreen} options={{ headerShown: false }} />
                    <Stack.Screen
                        name="RecipeDetail"
                        component={RecipeDetailScreen}
                        options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }}
                    />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Help" component={HelpScreen} options={{ headerShown: false }} />
                </>
            )}
        </Stack.Navigator>
    );
}

function AppRouter() {
    const [onboarded, setOnboarded] = useState<boolean | null>(null);

    useEffect(() => {
        isOnboardingDone().then(setOnboarded);
    }, []);

    if (onboarded === null) return <SplashScreen />;
    if (!onboarded) return <OnboardingScreen onDone={() => setOnboarded(true)} />;

    return (
        <AuthProvider>
            <NavigationContainer>
                <RootNavigator />
            </NavigationContainer>
        </AuthProvider>
    );
}

export default AppRouter;
