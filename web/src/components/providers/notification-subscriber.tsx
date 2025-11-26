"use client";

import { useEffect } from "react";
import { useTRPCClient } from "@/lib/trpc";
import { useUserRoles } from "@/hooks/useUserRoles";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function subscribeIfNeeded(trpc: ReturnType<typeof useTRPCClient>) {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    return;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const existingSub = await reg.pushManager.getSubscription();
    if (existingSub) {
      console.log('User is already subscribed notifications...')
      return;
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      return;
    }
    console.log('Subscribing user to notifications...')
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const subscriptionJson = subscription.toJSON();

    if (
      !subscriptionJson.endpoint ||
      !subscriptionJson.keys?.p256dh ||
      !subscriptionJson.keys?.auth
    ) {
      return;
    }

    const payload = {
      endpoint: subscriptionJson.endpoint,
      keys: {
        p256dh: subscriptionJson.keys.p256dh,
        auth: subscriptionJson.keys.auth,
      },
      topics: ["general"],
    };

    await trpc.notifications.subscribe.mutate(payload);
  } catch (err) {
  }
}

export default function NotificationSubscriber() {
  const trpc = useTRPCClient();
  const { roles, isLoading } = useUserRoles();

  useEffect(() => {
    if (isLoading || !roles) return;

    subscribeIfNeeded(trpc);
  }, [trpc, roles, isLoading]);

  return null;
}