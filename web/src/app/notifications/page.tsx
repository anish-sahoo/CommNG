"use client";

import { useState } from "react";
import { useTRPCClient } from "@/lib/trpc";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// NotificationsPage is an internal playground for the push pipeline, pairing a manual login with subscription/test buttons.
export default function NotificationsPage() {
  const trpc = useTRPCClient();
  const [status, setStatus] = useState<string | null>(null);

  // login state (copied pattern from file-s3-test page)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  async function handleSubscribe() {
    if (!("serviceWorker" in navigator)) {
      setStatus("Service workers not supported in this browser");
      return;
    }

    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setStatus(
          "VAPID public key not configured in NEXT_PUBLIC_VAPID_PUBLIC_KEY",
        );
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Notification permission denied");
        return;
      }

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
        setStatus("Subscription object missing required fields");
        return;
      }

      // Construct the subscription payload directly (do not wrap in an envelope)
      const payload: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
        topics: string[];
      } = {
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh: subscriptionJson.keys?.p256dh,
          auth: subscriptionJson.keys?.auth,
        },
        topics: ["general"],
      };

      // send subscription to backend via trpc (subscription object only)
      await trpc.notifications.subscribe.mutate(payload);
      setStatus("Subscribed and sent to server");
    } catch (err) {
      setStatus(`Subscribe error: ${String(err)}`);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Logging in...");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/sign-in/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          // include credentials so cookies set by the server (HttpOnly session cookie)
          // are persisted by the browser when the API and client are same-origin or
          // when CORS allows credentials.
          credentials: "include",
        },
      );
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        // Prefer the Cookie Store API where available, fallback to document.cookie
        await window.cookieStore.set({
          name: "better-auth.session",
          value: data.token,
          path: "/",
        });
        setStatus("Login successful. Token stored.");
      } else {
        setStatus(`Login failed: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      setStatus(`Login error: ${String(err)}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Push Notifications Demo</h1>
      <div className="space-y-4">
        {/* Login form (email/password) */}
        <form onSubmit={handleLogin} className="space-y-2 border p-4 rounded">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email:
            </label>
            <input
              id="email"
              className="border px-2 py-1 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password:
            </label>
            <input
              id="password"
              className="border px-2 py-1 w-full"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Login
            </button>
            {token && <div className="text-xs text-gray-600">Token stored</div>}
          </div>
        </form>

        <div className="space-y-3">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            type="button"
            onClick={handleSubscribe}
          >
            Subscribe for Push Notifications
          </button>

          <button
            type="button"
            className="bg-indigo-600 text-white px-4 py-2 rounded ml-2"
            onClick={async () => {
              setStatus("Sending test notification...");
              try {
                // protected TRPC mutation; client is configured to include credentials
                await trpc.notifications.testNotifications.mutate();
                setStatus(
                  "Test notification requested (server-side send triggered)",
                );
              } catch (err) {
                setStatus(`Test notification error: ${String(err)}`);
              }
            }}
          >
            Send Test Notification
          </button>

          {status && <div className="text-sm text-gray-700">{status}</div>}

          <p className="text-xs text-gray-500 mt-2">
            Make sure NEXT_PUBLIC_VAPID_PUBLIC_KEY is set in your environment.
          </p>
        </div>
      </div>
    </div>
  );
}
