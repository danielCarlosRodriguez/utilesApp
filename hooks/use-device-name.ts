import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

const DEVICE_NAME_KEY = '@utilesApp:deviceName';

export function useDeviceName() {
  const [deviceName, setDeviceNameState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeviceName();
  }, []);

  async function loadDeviceName() {
    try {
      const storedName = await AsyncStorage.getItem(DEVICE_NAME_KEY);
      if (storedName) {
        setDeviceNameState(storedName);
      } else {
        // Use device model as default name
        const defaultName = Device.modelName || Device.deviceName || 'Dispositivo';
        setDeviceNameState(defaultName);
        await AsyncStorage.setItem(DEVICE_NAME_KEY, defaultName);
      }
    } catch (error) {
      console.error('Error loading device name:', error);
      setDeviceNameState('Dispositivo');
    } finally {
      setIsLoading(false);
    }
  }

  async function setDeviceName(name: string) {
    try {
      await AsyncStorage.setItem(DEVICE_NAME_KEY, name);
      setDeviceNameState(name);
    } catch (error) {
      console.error('Error saving device name:', error);
    }
  }

  return { deviceName, setDeviceName, isLoading };
}
