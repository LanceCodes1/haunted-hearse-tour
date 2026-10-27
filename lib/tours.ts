// Back end only: checks a tour before it's saved. Shared by the tours API and (later) the AI planner,
// so both follow the exact same rules.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Persona } from "@/lib/generated/prisma/enums";
import { ROSTER } from "@/lib/roster";

// One number for "how long can a tour be", so the API, planner, and UI can never disagree
export const MAX_LEGENDS = 6;
const MAX_NAME_CHARS = 60; // matches VarChar(60) in schema.prisma; checked here first for a friendly message

// Public roster only: test-only entries (Elvira) must never end up in a saved tour
const PUBLIC_IDS = new Set(ROSTER.filter((legend) => !legend.testOnly).map((legend) => legend.id));

// Persona list comes from the database enum, so it can't drift from what Postgres accepts
const PERSONAS: string[] = Object.values(Persona);

export type TourInput = { name: string; legendIds: string[]; persona: Persona };
export type TourCheck = { ok: true; tour: TourInput } | { ok: false; message: string };

// Input is `unknown` because it arrives as JSON from the browser (or later the AI): nothing about it is trusted
export function validateTour(input: unknown): TourCheck {
  if (typeof input !== "object" || input === null) return { ok: false, message: "That tour didn't come through. Try again." };
  const { name, legendIds, persona } = input as Record<string, unknown>;

  // Name: trimmed so "   " counts as empty
  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) return { ok: false, message: "Give your tour a name." };
  if (cleanName.length > MAX_NAME_CHARS) return { ok: false, message: `Tour names can be up to ${MAX_NAME_CHARS} characters.` };

  // Legends: a real list, 1 to MAX_LEGENDS, every ID on the public roster, no repeats
  if (!Array.isArray(legendIds) || legendIds.length === 0) return { ok: false, message: "Pick at least one legend for your tour." };
  if (legendIds.length > MAX_LEGENDS) return { ok: false, message: `A tour can have up to ${MAX_LEGENDS} legends.` };
  if (!legendIds.every((id) => typeof id === "string" && PUBLIC_IDS.has(id))) return { ok: false, message: "That legend isn't on our tour." };
  if (new Set(legendIds).size !== legendIds.length) return { ok: false, message: "Each legend can only be on the tour once." };

  // Persona: missing or null means "no preference", so Mortimer (the default narrator) takes the wheel.
  // A value that IS sent but isn't one of ours ("vampire") is a mistake or tampering, so we reject it instead of guessing.
  if (persona === undefined || persona === null) return { ok: true, tour: { name: cleanName, legendIds, persona: Persona.mortimer } };
  if (typeof persona !== "string" || !PERSONAS.includes(persona)) return { ok: false, message: "Pick a narrator for your tour." };

  return { ok: true, tour: { name: cleanName, legendIds, persona: persona as Persona } };
}

// Shown when Neon is asleep or unreachable: users get plain language, the raw error stays in the log
export const DB_DOWN_MESSAGE = "The crypt is locked right now. Try again in a moment.";

// 6 random bytes = 8 URL-safe characters: short enough to share, about 281 trillion options so nobody can guess one
export function newTourId(): string {
  return randomBytes(6).toString("base64url");
}
// Anything that doesn't look like one of our IDs is turned away before we ask the database
export const TOUR_ID_PATTERN = /^[A-Za-z0-9_-]{8}$/;

// 16 random bytes: far too long to guess, so only the person we hand it to (the creator) can delete
export function newDeleteCode(): string {
  return randomBytes(16).toString("base64url");
}

// Only this fingerprint is stored. Someone reading the database still can't work backwards to the code.
export function hashDeleteCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

// Constant-time compare: the response takes the same time whether a guess is close or not, so timing leaks nothing
export function deleteCodeMatches(code: string, storedHash: string): boolean {
  const given = Buffer.from(hashDeleteCode(code), "hex");
  const stored = Buffer.from(storedHash, "hex");
  return given.length === stored.length && timingSafeEqual(given, stored);
}
