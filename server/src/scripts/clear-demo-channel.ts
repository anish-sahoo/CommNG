import { eq } from "drizzle-orm";
import { messages } from "../data/db/schema.js";
import { db, shutdownPostgres } from "../data/db/sql.js";

/**
 * Script to clear demo channel until we implement deleting posts
 * cd/server
 * run: `npx dotenv -e .env -- tsx src/scripts/clear-demo-channel.ts`
 */

async function clearDemoChannel() {
  const demoChannelId = 1;

  const deleted = await db
    .delete(messages)
    .where(eq(messages.channelId, demoChannelId))
    .returning({ messageId: messages.messageId });

  console.log(
    `Deleted ${deleted.length} messages from channel_id=${demoChannelId}`,
  );
}

clearDemoChannel()
  .catch((error) => {
    console.error("Failed to clear demo channel messages:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await shutdownPostgres();
  });
