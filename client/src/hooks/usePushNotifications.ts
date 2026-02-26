import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';

export function usePushNotifications() {
  const subscriptionRef = useRef<PushSubscription | null>(null);
  const { mutate: subscribe } = trpc.pushNotification.subscribe.useMutation();
  const { mutate: unsubscribe } = trpc.pushNotification.unsubscribe.useMutation();

  useEffect(() => {
    // Check if the browser supports push notifications
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    const initPushNotifications = async () => {
      try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Notification permission denied');
          return;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.VITE_VAPID_PUBLIC_KEY || ''
          ),
        });

        subscriptionRef.current = subscription;

        // Send subscription to server
        subscribe({
          endpoint: subscription.endpoint,
          keys: {
            auth: arrayBufferToBase64(subscription.getKey('auth')),
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          },
        });
      } catch (error) {
        console.error('Failed to setup push notifications:', error);
      }
    };

    initPushNotifications();

    return () => {
      // Cleanup on unmount
      if (subscriptionRef.current) {
        unsubscribe({ endpoint: subscriptionRef.current.endpoint });
      }
    };
  }, [subscribe, unsubscribe]);

  return { isSupported: 'serviceWorker' in navigator && 'PushManager' in window };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
