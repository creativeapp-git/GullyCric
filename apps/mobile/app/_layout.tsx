import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { useFonts, Outfit_400Regular, Outfit_700Bold, Outfit_900Black } from '@expo-google-fonts/outfit';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { useRouter, useSegments, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/authStore';
import 'react-native-reanimated';
import { Colors } from '@/constants/Theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const GullyCricLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.danger,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_700Bold,
    Outfit_900Black,
    ...Ionicons.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const { isLoggedIn } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return;

    const inAuthGroup = (segments as string[]).includes('login');

    if (!isLoggedIn && !inAuthGroup) {
      // Redirect to login if not logged in and not already in auth group
      router.replace('/(auth)/login' as any);
    } else if (isLoggedIn && inAuthGroup) {
      // Redirect to home if logged in but in auth group
      router.replace('/(tabs)' as any);
    }
  }, [isLoggedIn, segments, loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={GullyCricLightTheme}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen
          name="match/setup"
          options={{
            title: 'Host a Match',
            headerShown: true,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="match/[id]"
          options={{ headerShown: false }}
        />
      </Stack>
    </ThemeProvider>
  );
}
