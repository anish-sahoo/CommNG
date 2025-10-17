import { z } from "zod";
import { userDevices } from "../data/db/schema/index.js";
import { db } from "../data/db/sql.js";
import { procedure, router } from "../trpc/trpc.js";
import log from "../utils/logger.js";

const ping = procedure.query(() => {
  log.debug("ping");
  return "pong from comms";
});

const registerDevice = procedure
  .input(
    z.object({
      deviceType: z.string(),
      deviceToken: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    log.debug("registerDevice", { deviceType: input.deviceType });

    const [device] = await db
      .insert(userDevices)
      .values({
        userId: 1, // TODO: get from auth context
        deviceType: input.deviceType,
        deviceToken: input.deviceToken,
      })
      .returning();

    return device;
  });

export const commsRouter = router({
  ping,
  registerDevice,
});
