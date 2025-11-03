# Web Push / VAPID Setup

This document explains how to generate VAPID keys, configure environment variables for the server and client, and perform a quick end-to-end test of Web Push (no cloud provider required).

## Overview

We use the `web-push` Node library on the server to send Web Push messages directly to browser endpoints (Push API). Push subscriptions are stored in the database in `push_subscriptions` (structured columns: endpoint, p256dh, auth, keys jsonb, topics jsonb, userId, isActive).

Important notes:
- Push notifications require a Service Worker and a secure origin (HTTPS). `localhost` is allowed for development without HTTPS by most browsers.
- Keep the VAPID private key secret. Do not commit it to source control.


## 1) Generate VAPID keys

Option A — using `web-push` CLI (recommended / quick):

```bash
# from project root (uses npx so no global install needed)
npx web-push generate-vapid-keys --json
```

This prints JSON with `publicKey` and `privateKey`. Example output:

```json
{
  "publicKey": "BEx...",
  "privateKey": "XyZ..."
}
```

Option B — using Node (programmatic):

```bash
node -e "console.log(JSON.stringify(require('web-push').generateVAPIDKeys()))"
```

Copy the resulting `publicKey` and `privateKey` values.


## 2) Set environment variables

On the server (e.g., in your `.env` file or deployment environment):

```
VAPID_PUBLIC_KEY=...         # publicKey from step 1
VAPID_PRIVATE_KEY=...        # privateKey from step 1
VAPID_CONTACT_EMAIL=mailto:admin@example.com  # your contact email (mailto:...)
```

On the client (Next.js), expose the public key to the browser:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   # same value as VAPID_PUBLIC_KEY
```

Then restart the server and the Next development server so environment values are reloaded.


## 3) How the repo uses the keys

- The server code reads `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_CONTACT_EMAIL` to configure `web-push.setVapidDetails()` inside the singleton `NotificationService`.
- The client uses `NEXT_PUBLIC_VAPID_PUBLIC_KEY` when calling `registration.pushManager.subscribe({ applicationServerKey })`.


## 4) Verify subscription flow (dev)

1. Start the server and the Next app.
2. Open the notifications demo page (e.g., `/notifications` in the Next app). The client page registers the Service Worker and calls the TRPC `notifications.subscribe` endpoint with a PushSubscription-shaped object (and optional `topics`).
3. Confirm in the server logs or database that a row was created in `push_subscriptions` with the `endpoint` and `keys`.


## 5) Sending a test notification

The usual flow is:
- Some event triggers `notificationService.sendNotifications(topic?, payload)`, which will fetch active subscriptions and call `web-push.sendNotification` for each one.

Quick test using `web-push` directly from Node (replace `<SUBSCRIPTION_JSON>` with an actual subscription object printed or exported from the DB):

```js
// test-send.js (run from server root)
const webpush = require('web-push');
const sub = JSON.parse(process.argv[2]); // subscription JSON
webpush.setVapidDetails('mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
webpush.sendNotification(sub, JSON.stringify({ title: 'Test', body: 'Hello' }))
  .then(() => console.log('sent'))
  .catch(err => console.error(err));

// usage (from server folder):
node test-send.js '<SUBSCRIPTION_JSON>'
```

Alternatively, trigger the application flow that calls `notificationService.sendNotifications()` (there may be an admin utility or an event in your app that can do this).

## 6) Security & production notes

- Rotate your VAPID keys if you suspect compromise. Update both server and any clients using the public key.
- Use a proper contact `mailto:` address so push services can reach you if needed.
- On production, serve your site over HTTPS (required by Service Workers and push on non-localhost).


## 7) Troubleshooting

- Browser denies permission to show notifications: ensure you requested notification permission from the page and the Service Worker registered successfully.
- Push subscription fails to register: check that `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is present and used as the `applicationServerKey` (URL-safe base64 key). The client code should convert the base64 key to a Uint8Array before calling `subscribe()`.
- When sending a notification you get 404 / 410 responses from `web-push`: these indicate the subscription is gone; the service will remove inactive subscriptions automatically.
