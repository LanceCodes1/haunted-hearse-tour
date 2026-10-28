// Front end: delete codes live only in this browser. Whoever holds a tour's code is its creator,
// so only they will see the Delete button (Phase 4 reads this same list).
const CODES_KEY = "hht-tour-codes";

// Returns false if the browser won't store it (private mode, storage blocked), so the screen can warn the creator
export function rememberDeleteCode(id: string, code: string): boolean {
  try {
    let codes: Record<string, string> = {};
    try {
      const saved = JSON.parse(localStorage.getItem(CODES_KEY) ?? "{}");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) codes = saved;
    } catch {
      // An unreadable old value: start a fresh list rather than lose the new code
    }
    codes[id] = code;
    localStorage.setItem(CODES_KEY, JSON.stringify(codes));
    return true;
  } catch {
    return false;
  }
}
