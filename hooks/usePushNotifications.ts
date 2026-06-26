import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | false>(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        sendTokenToBackend(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
      // Here you can handle routing based on response.notification.request.content.data
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && expoPushToken) {
      sendTokenToBackend(expoPushToken);
    }
  }, [isAuthenticated, expoPushToken]);

  const sendTokenToBackend = async (token: string) => {
    try {
      const userToken = await SecureStore.getItemAsync('userToken');
      if (!userToken) return;
      
      await axios.post(`${BASE_URL}/users/me/push-token`, { token }, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      console.log('Push token saved to backend successfully');
    } catch (err) {
      console.error('Failed to save push token to backend:', err);
    }
  };

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EE0000',
    });
  }

  if (Device.isDevice) {
    const existingSettings = (await Notifications.getPermissionsAsync()) as any;
    let finalGranted = existingSettings.granted || existingSettings.status === 'granted';
    if (!finalGranted) {
      const newSettings = (await Notifications.requestPermissionsAsync()) as any;
      finalGranted = newSettings.granted || newSettings.status === 'granted';
    }
    if (!finalGranted) {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
      token = (await Notifications.getDevicePushTokenAsync()).data;
    } catch (e: any) {
      console.error('Failed to get FCM token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
