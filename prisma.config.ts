// Prisma CLI settings. Prisma 7 doesn't read env files on its own, so we load .env.local here.
// On Vercel there's no .env.local; dotenv quietly skips it and Vercel's env vars are used.
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Direct (unpooled) URL: migrations need a real session, which the pooler can't give
  datasource: { url: env("DATABASE_URL") },
});
