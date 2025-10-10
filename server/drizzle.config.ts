import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/data/db/schema",
  out: "./src/data/db/migrations",
});
