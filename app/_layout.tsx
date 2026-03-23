import { ClerkLoaded, ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { upsertProfile } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';

import WelcomeScreen from '@/components/WelcomeScreen';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { tokenCache } from '@/lib/tokenCache';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

const CLERK_PUBLISHABLE_KEY = "pk_test_d2hvbGUtc2hpbmVyLTI2LmNsZXJrLmFjY291bnRzLmRldiQ";
console.log("--- DEBUG: Clerk Config (HARDCODED) ---");
console.log("Key Found:", !!CLERK_PUBLISHABLE_KEY);
console.log("---------------------------------------");

function AuthRoutingGuard() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const hasSyncedUser = React.useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user && !hasSyncedUser.current) {
        hasSyncedUser.current = true;
        const syncUser = async () => {
            try {
                const token = await getToken({ template: 'supabase' });
                if (token) {
                    await upsertProfile(token, {
                        id: user.id,
                        email: user.emailAddresses[0]?.emailAddress || null,
                        full_name: user.fullName || user.firstName || null,
                        avatar_url: user.imageUrl || null,
                    });
                }
            } catch (error: any) {
                // Ağ bağlantısı arka planda koptuğunda (clerk_offline) ekrana kocaman kırmızı uyarı 
                // çıkartmaması için error yerine log/warn kullanıyoruz.
                console.log("Supabase profil eşitleme atlandı:", error?.message || error);
            }
        };
        syncUser();
    }

    const inAuthGroup = segments[0] === 'sign-in' || segments[0] === 'sign-up';

    if (!isSignedIn && !inAuthGroup) {
      hasSyncedUser.current = false;
      router.replace('/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/');
    }
  }, [isSignedIn, isLoaded, segments, user]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      setIsFirstLaunch(hasLaunched === null);
    } catch (e) {
      setIsFirstLaunch(false);
    }
  };

  const handleWelcomeComplete = async () => {
    await AsyncStorage.setItem('hasLaunched', 'true');
    setIsFirstLaunch(false);
  };

  if (isFirstLaunch === null) return null; // App is verifying status

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthRoutingGuard />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="sign-up" options={{ headerShown: false }} />
            <Stack.Screen
              name="profile"
              options={{
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>

          {isFirstLaunch && <WelcomeScreen onStart={handleWelcomeComplete} />}

          <StatusBar style="auto" />
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
