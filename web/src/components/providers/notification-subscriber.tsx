"use client";

import { useEffect, useRef } from "react";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useTRPCClient } from "@/lib/trpc";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function subscribeIfNeeded(trpc: ReturnType<typeof useTRPCClient>) {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    console.error(
      "subscribeIfNeeded: browser doesn't support service workers or notifications",
    );
    return;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.error(
      "subscribeIfNeeded: NEXT_PUBLIC_VAPID_PUBLIC_KEY not set; skipping",
    );
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    console.debug("Service worker registration succeeded:", reg);

    const existingSub = await reg.pushManager.getSubscription();
    if (existingSub) {
      console.debug(
        "Existing subscription found; sending to backend...",
        existingSub,
      );
      await sendCurrentSubscriptionToBackend(trpc);
      return;
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      return;
    }
    console.debug(
      "No existing subscription; subscribing user to notifications...",
    );
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
      console.debug(
        "New subscription missing required fields; skipping backend send",
      );
      return;
    }

    const payload = {
      endpoint: subscriptionJson.endpoint as string,
      keys: {
        p256dh: subscriptionJson.keys?.p256dh as string,
        auth: subscriptionJson.keys?.auth as string,
      },
      topics: ["general"],
    };
    try {
      console.debug("Sending newly-created subscription to backend...");
      await trpc.notifications.subscribe.mutate(payload);
      console.debug("Successfully sent new subscription to backend");
    } catch (err) {
      console.error("Failed to save new subscription to backend", err);
    }
  } catch (err) {
    console.error("subscribeIfNeeded failed", err);
  }
}

async function sendCurrentSubscriptionToBackend(
  trpc: ReturnType<typeof useTRPCClient>,
) {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      console.warn(
        "sendCurrentSubscriptionToBackend: no service worker registration",
      );
      return;
    }
    const existingSub = await reg.pushManager.getSubscription();
    if (!existingSub) {
      console.debug(
        "sendCurrentSubscriptionToBackend: no existing subscription",
      );
      return;
    }

    const subscriptionJson = existingSub.toJSON();
    if (
      !subscriptionJson.endpoint ||
      !subscriptionJson.keys?.p256dh ||
      !subscriptionJson.keys?.auth
    ) {
      console.warn(
        "sendCurrentSubscriptionToBackend: existing subscription is missing fields",
      );
      return;
    }

    const payload = {
      endpoint: subscriptionJson.endpoint as string,
      keys: {
        p256dh: subscriptionJson.keys?.p256dh as string,
        auth: subscriptionJson.keys?.auth as string,
      },
      topics: ["general"],
    };

    console.debug(
      "sendCurrentSubscriptionToBackend: sending subscription to backend (roles changed / login)...",
    );
    try {
      await trpc.notifications.subscribe.mutate(payload);
      console.debug(
        "sendCurrentSubscriptionToBackend: successfully saved subscription to backend",
      );
    } catch (err) {
      console.error(
        "sendCurrentSubscriptionToBackend: backend save failed",
        err,
      );
    }
  } catch (err) {
    console.error(
      "sendCurrentSubscriptionToBackend: failed to check registration",
      err,
    );
  }
}

export default function NotificationSubscriber() {
  const trpc = useTRPCClient();
  const { roles, isLoading } = useUserRoles();
  const attemptedRef = useRef(false);
  const sentOnRolesRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;
    console.debug("NotificationSubscriber: running subscribeIfNeeded");
    // Run registration on mount unconditionally — the SW should be registered
    // for all visitors. When the user is authenticated (we can tell from
    // `roles`) we'll attempt to save the subscription to the backend; if not,
    // we'll still register the subscription locally.
    subscribeIfNeeded(trpc);
  }, [trpc]);

  // If the user logs in (roles become present), send the existing subscription to the backend
  useEffect(() => {
    if (isLoading) return;
    if (!roles) return;
    if (sentOnRolesRef.current) return;

    sentOnRolesRef.current = true;
    console.debug(
      "NotificationSubscriber: roles present; re-sending subscription to backend if any",
    );
    sendCurrentSubscriptionToBackend(trpc);
  }, [trpc, roles, isLoading]);

  return null;
}
