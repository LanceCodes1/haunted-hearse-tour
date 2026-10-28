// Front end: delete codes live only in this browser. Whoever holds a tour's code is its creator,
// so only they will see the Delete button (Phase 4 reads this same list).
const CODES_KEY = "hht-tour-codes";

// Reads the saved list. Anything unreadable (bad JSON, storage blocked) counts as an empty list.
function readCodes(): Record<string, string> {
  try {
    const saved = JSON.parse(localStorage.getItem(CODES_KEY) ?? "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;
  } catch {
    // fall through to an empty list
  }
  return {};
}

// Returns false if the browser won't store it (private mode, storage blocked), so the screen can warn the creator
export function rememberDeleteCode(id: string, code: string): boolean {
  try {
    const codes = readCodes(); // an unreadable old value starts a fresh list rather than losing the new code
    codes[id] = code;
    localStorage.setItem(CODES_KEY, JSON.stringify(codes));
    return true;
  } catch {
    return false;
  }
}

// This browser's code for one tour, or null if it didn't create it. The type check also blocks keys like "constructor".
export function getDeleteCode(id: string): string | null {
  const code = readCodes()[id];
  return typeof code === "string" ? code : null;
}

// After a delete, drop the code so this browser stops offering a Delete button for a tour that's gone
export function forgetDeleteCode(id: string): void {
  try {
    const codes = readCodes();
    delete codes[id];
    localStorage.setItem(CODES_KEY, JSON.stringify(codes));
  } catch {
    // storage blocked: nothing to forget
  }
}
