import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../theme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, Text } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import RecognizedProductsScreen from '../screens/RecognizedProductsScreen';
import RecipeListScreen from '../screens/RecipeListScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CookingModeScreen from '../screens/CookingModeScreen';

// Types
export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
    RecognizedProducts: { imageUri: string };
    RecipeList: { products: string[] };
    RecipeDetail: { recipeId: string; recipe: any };
    CookingMode: { steps: string[], recipeName: string };
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
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.border,
                    paddingBottom: 5,
                    height: 60,
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'HomeTab') iconName = '🍳';
                    else if (route.name === 'History') iconName = '📜';
                    else if (route.name === 'Profile') iconName = '👤';

                    return <Text style={{ fontSize: 24 }}>{iconName}</Text>; // Using emojis for MVP simplicity
                },
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{ title: 'Главная' }}
            />
            <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{ title: 'История' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Профиль' }}
            />
        </Tab.Navigator>
    );
}

function RootNavigator() {
    const { isAuthenticated } = useAuth();

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.surface,
                },
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                    fontWeight: '600',
                },
                contentStyle: {
                    backgroundColor: theme.colors.background,
                },
                headerShadowVisible: false,
                animation: 'slide_from_right', // Default smooth slide transition
                animationDuration: 250,
            }}
        >
            {!isAuthenticated ? (
                <Stack.Screen
                    name="Auth"
                    component={AuthNavigator}
                    options={{ headerShown: false, animation: 'fade' }}
                />
            ) : (
                <>
                    <Stack.Screen
                        name="Main"
                        component={MainTabNavigator}
                        options={{ headerShown: false, animation: 'fade' }}
                    />
                    <Stack.Screen
                        name="CookingMode"
                        component={CookingModeScreen}
                        options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }}
                    />
                    <Stack.Screen
                        name="RecognizedProducts"
                        component={RecognizedProductsScreen}
                        options={{ title: 'Продукты', animation: 'slide_from_bottom' }}
                    />
                    <Stack.Screen
                        name="RecipeList"
                        component={RecipeListScreen}
                        options={{ title: 'Рецепты' }}
                    />
                    <Stack.Screen
                        name="RecipeDetail"
                        component={RecipeDetailScreen}
                        options={{ title: 'Рецепт', animation: 'slide_from_bottom', presentation: 'modal' }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <AuthProvider>
            <NavigationContainer>
                <RootNavigator />
            </NavigationContainer>
        </AuthProvider>
    );
}
