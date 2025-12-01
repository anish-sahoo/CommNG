<div align="center" style="margin: 1.5rem auto;">
  <table role="presentation" style="border:none;border-radius:18px;background:#0f172a;padding:1.5rem 2rem;box-shadow:0 10px 30px rgba(15,23,42,0.35);color:#f8fafc;width:100%;max-width:1200px;">
    <tr>
      <td style="vertical-align:middle;padding-right:1.5rem;">
        <img src="../web/public/favicon_yellow.svg" alt="CommNG Favicon" width="72">
      </td>
      <td style="vertical-align:middle;">
        <h1 style="margin:0;font-size:2rem;color:#f8fafc;">📣 Notifications Setup</h1>
      </td>
    </tr>
  </table>
</div>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#1-generate-vapid-keys">Generate Keys</a> •
  <a href="#2-set-environment-variables">Env Vars</a> •
  <a href="#3-how-the-repo-uses-the-keys">Usage</a> •
  <a href="#4-verify-subscription-flow-dev">Verify Flow</a> •
  <a href="#5-sending-a-test-notification">Test Send</a> •
  <a href="#6-security--production-notes">Security</a> •
  <a href="#7-troubleshooting">Troubleshooting</a>
</p>

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
- **GitHub Actions Permissions**: The GitHub Actions IAM user needs `secretsmanager:GetSecretValue` permission on the VAPID keys secret to fetch it during Docker builds. Add this inline policy:

  ```bash
  aws iam put-user-policy \
    --user-name CommNG_GithubActionsUser \
    --policy-name AllowReadVapidKeys \
    --policy-document '{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": "secretsmanager:GetSecretValue",
          "Resource": "arn:aws:secretsmanager:us-east-1:215600395213:secret:dev/comm_ng/vapid-keys*"
        }
      ]
    }'
  ```


## 7) Troubleshooting

- Browser denies permission to show notifications: ensure you requested notification permission from the page and the Service Worker registered successfully.
- Push subscription fails to register: check that `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is present and used as the `applicationServerKey` (URL-safe base64 key). The client code should convert the base64 key to a Uint8Array before calling `subscribe()`.
- When sending a notification you get 404 / 410 responses from `web-push`: these indicate the subscription is gone; the service will remove inactive subscriptions automatically.

Additional behavior:

- 401 Unauthorized responses indicate an issue with VAPID authentication — the subscription is kept and a warning is logged for investigation.
- 429 Rate Limited responses are logged as a warning (we don't delete the subscription), and the system may benefit from throttling/backoff if you see many.
- Other transient errors (5xx, network) are logged as errors but won't cause the subscription to be deleted so retries remain possible.
