import { eq, ne } from "drizzle-orm";
import { channels } from "../src/data/db/schema.js";
import { db, shutdownPostgres } from "../src/data/db/sql.js";

/**
 * Clears every channel except for the default Events channel.
 *
 * Usage:
 *   cd server
 *   npx dotenv -e .env -- tsx scripts/clear-non-event-channels.ts
 */
const EVENT_CHANNEL_NAME = "Events";

async function clearNonEventChannels() {
  const [eventChannel] = await db
    .select({
      channelId: channels.channelId,
      name: channels.name,
    })
    .from(channels)
    .where(eq(channels.name, EVENT_CHANNEL_NAME))
    .limit(1);

  if (!eventChannel) {
    throw new Error(
      `Could not find the "${EVENT_CHANNEL_NAME}" channel. Aborting cleanup.`,
    );
  }

  const removedChannels = await db
    .delete(channels)
    .where(ne(channels.channelId, eventChannel.channelId))
    .returning({
      channelId: channels.channelId,
      name: channels.name,
    });

  console.log(
    `Deleted ${removedChannels.length} channel(s); preserved #${eventChannel.channelId} (${eventChannel.name}).`,
  );

  if (removedChannels.length > 0) {
    console.table(removedChannels);
  }
}

clearNonEventChannels()
  .catch((error) => {
    console.error("Failed to clear non-event channels:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await shutdownPostgres();
  });
