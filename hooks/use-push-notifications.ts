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
  const [pushDebugLog, setPushDebugLog] = useState<string[]>([]);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  function addLog(msg: string) {
    console.log(msg);
    setPushDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
  }

  useEffect(() => {
    registerForPushNotifications();

    // Listen for incoming notifications (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
        addLog('Push: Notification received in foreground!');
      }
    );

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        setNotification(response.notification);
        addLog('Push: Notification tapped!');
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
      addLog('Push: Starting registration...');
      addLog(`Push: isDevice = ${Device.isDevice}`);

      // Push notifications only work on physical devices
      if (!Device.isDevice) {
        addLog('Push: Must use physical device');
        return;
      }

      // Check / request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      addLog(`Push: Existing permission = ${existingStatus}`);
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        addLog(`Push: Requested permission = ${finalStatus}`);
      }

      if (finalStatus !== 'granted') {
        addLog('Push: Permission NOT granted');
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
        addLog('Push: Android channel created');
      }

      // Get the Expo push token
      addLog('Push: Getting Expo push token...');
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'da5dd29e-72c1-46e0-8de4-e399459b890b',
      });
      const token = tokenData.data;
      addLog(`Push: Token = ${token}`);
      setExpoPushToken(token);

      // Check if we already registered this token
      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (storedToken === token) {
        addLog('Push: Token already registered, skipping');
        return;
      }

      // Register token in backend
      const deviceName = Device.modelName || Device.deviceName || 'Unknown';
      addLog(`Push: Registering in backend, device = ${deviceName}`);
      const success = await registerPushToken(token, deviceName);
      addLog(`Push: Backend result = ${success}`);

      if (success) {
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        addLog('Push: Token saved successfully');
      }
    } catch (error) {
      addLog(`Push: ERROR: ${error}`);
      console.error('Push: Error registering:', error);
    }
  }

  return {
    expoPushToken,
    notification,
    pushDebugLog,
  };
}
