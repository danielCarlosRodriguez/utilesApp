import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { registerPushToken } from '@/services/api';

const PUSH_TOKEN_KEY = '@utilesApp:pushToken';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    registerForPushNotifications();

    // Listen for incoming notifications (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        setNotification(response.notification);
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  async function registerForPushNotifications() {
    try {
      // Push notifications only work on physical devices
      if (!Device.isDevice) {
        console.log('Push: Must use physical device');
        return;
      }

      // Check / request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push: Permission not granted');
        return;
      }

      // Set notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Pedidos',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      }

      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: undefined, // Uses the projectId from app.json automatically
      });
      const token = tokenData.data;
      setExpoPushToken(token);

      // Check if we already registered this token
      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (storedToken === token) {
        return; // Already registered
      }

      // Register token in backend
      const deviceName = Device.modelName || Device.deviceName || 'Unknown';
      const success = await registerPushToken(token, deviceName);

      if (success) {
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        console.log('Push: Token registered successfully');
      }
    } catch (error) {
      console.error('Push: Error registering:', error);
    }
  }

  return {
    expoPushToken,
    notification,
  };
}
