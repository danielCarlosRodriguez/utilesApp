import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { OrderProvider, useOrderContext } from '@/context/order-context';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

function PushNotificationHandler() {
  const { loadOrderById } = useOrderContext();
  const router = useRouter();
  usePushNotifications();

  useEffect(() => {
    // Handle notification tap (when app opens from notification)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data;
        if (data?.orderId) {
          await loadOrderById(data.orderId as string);
          router.navigate('/(tabs)/orders');
        }
      }
    );

    return () => subscription.remove();
  }, [loadOrderById, router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <OrderProvider>
        <PushNotificationHandler />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </OrderProvider>
    </ThemeProvider>
  );
}
