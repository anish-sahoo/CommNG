This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## ShadCN Components

Use the shadcn CLI to add components to our repo.

See [shadcn's docs](https://ui.shadcn.com/docs/components) for the components we have access to and installation instructions.

## Mentorship flow (frontend ↔ backend)

- **Mentor application**
  - UI: `app/mentorship/apply/mentor/page.tsx`
  - Backend call: `trpc.mentorship.createMentor.mutationOptions()`
  - Files: uploads resume via `files.createPresignedUpload` / `files.confirmUpload` and sends `resumeFileId`.
  - On success: redirects to `app/mentorship/dashboard/page.tsx`.

- **Mentee application**
  - UI: `app/mentorship/apply/mentee/page.tsx`
  - Backend call: `trpc.mentorship.createMentee.mutationOptions()`
  - Files: uploads resume via `files.createPresignedUpload` / `files.confirmUpload` and sends `resumeFileId`.
  - On success: redirects to `app/mentorship/dashboard/page.tsx`.

- **Mentorship dashboard**
  - UI: `app/mentorship/dashboard/page.tsx`
  - Backend call: `trpc.mentorship.getMentorshipData.useQuery()`
  - Shows whether mentor/mentee profiles exist and basic match counts, with links back to mentor/mentee applications when profiles are missing.
