import { eq } from "drizzle-orm";
import { users } from "../src/data/db/schema.js";
import { db, shutdownPostgres } from "../src/data/db/sql.js";
import { ReportRepository } from "../src/data/repository/reports-repo.js";

/**
 * Seeds a placeholder report for a given user email. Usage:
 *   cd server
 *   npx dotenv -e .env -- tsx scripts/seed-report.ts basic@basic.basic "Report title" "Report description"
 */
async function seedReport() {
  const emailArg = process.argv[2];
  const titleArg = process.argv[3];
  const descriptionArg = process.argv[4];

  if (!emailArg) {
    console.error(
      "Usage: tsx scripts/seed-report.ts <user-email> [title] [description]",
    );
    process.exit(1);
  }

  const email = emailArg.toLowerCase().trim();
  const title =
    titleArg ?? "Sample report to verify the reports page interactions";
  const description =
    descriptionArg ??
    "This is a placeholder report inserted via scripts/seed-report.ts.";

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    console.error(
      `Could not find a user with email ${email}. Create the user first, then rerun this script.`,
    );
    process.exit(1);
  }

  const repo = new ReportRepository();
  const created = await repo.createReport({
    category: "Resources",
    title,
    description,
    status: "Pending",
    submittedBy: user.id,
    attachments: [],
  });

  console.log("Seeded report:");
  console.log(`  ID: ${created.reportId}`);
  console.log(`  Title: ${created.title}`);
  console.log(`  Submitted by: ${email}`);
}

seedReport()
  .catch((error) => {
    console.error("Failed to seed report:", error);
    process.exit(1);
  })
  .finally(async () => {
    await shutdownPostgres();
  });
