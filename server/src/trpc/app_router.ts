import { commsRouter } from "../routers/comms.js";
import { filesRouter } from "../routers/files.js";
import { inviteCodeRouter } from "../routers/invite-codes.js";
import { mentorshipRouter } from "../routers/mentorship.js";
import { messageBlastRouter } from "../routers/message-blasts.js";
import { notificationsRouter } from "../routers/notifications.js";
import { reportsRouter } from "../routers/reports.js";
import { searchRouter } from "../routers/search.js";
import { userRouter } from "../routers/users.js";
import { router } from "../trpc/trpc.js";

export const appRouter = router({
  comms: commsRouter,
  mentorship: mentorshipRouter,
  reports: reportsRouter,
  user: userRouter,
  files: filesRouter,
  search: searchRouter,
  notifications: notificationsRouter,
  messageBlasts: messageBlastRouter,
  inviteCodes: inviteCodeRouter,
});

export type AppRouter = typeof appRouter;
