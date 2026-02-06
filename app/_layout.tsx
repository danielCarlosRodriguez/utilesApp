import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
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
  const { pushDebugLog } = usePushNotifications();
  const [showDebug, setShowDebug] = useState(false);

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

  // DEBUG: Show push notification registration log
  if (!showDebug || pushDebugLog.length === 0) return null;

  return (
    <View style={debugStyles.container}>
      <View style={debugStyles.header}>
        <Text style={debugStyles.title}>Push Debug Log</Text>
        <TouchableOpacity onPress={() => setShowDebug(false)}>
          <Text style={debugStyles.close}>X</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={debugStyles.scroll}>
        {pushDebugLog.map((log, i) => (
          <Text key={i} style={debugStyles.log}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const debugStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 8,
    padding: 10,
    maxHeight: 250,
    zIndex: 9999,
    elevation: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    color: '#4ADE80',
    fontWeight: 'bold',
    fontSize: 14,
  },
  close: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  scroll: {
    maxHeight: 200,
  },
  log: {
    color: '#E5E7EB',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <OrderProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <PushNotificationHandler />
        <StatusBar style="auto" />
      </OrderProvider>
    </ThemeProvider>
  );
}
