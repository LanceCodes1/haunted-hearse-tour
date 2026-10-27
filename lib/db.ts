// Back end only: one shared database client for every route.
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/lib/generated/prisma/client";

// Pooled URL at runtime: serverless functions open many short connections, and the pooler shares them
function createClient() {
  const connectionString = process.env.DATABASE_URL_POOLED;
  if (!connectionString) throw new Error("DATABASE_URL_POOLED is not set"); // fail loudly in the log, not silently
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

// Dev hot reload re-runs this file; reusing one client stops it from piling up connections
const globalForDb = globalThis as unknown as { db?: PrismaClient };
export const db = globalForDb.db ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
