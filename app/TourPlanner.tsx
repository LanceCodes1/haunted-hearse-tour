"use client";
// Front end: the AI Tour Planner. The visitor describes a tour; our /api/plan route picks legends from the roster.
// Nothing is saved yet: this screen only shows the planned route.
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { MAX_REQUEST_CHARS } from "@/lib/planLimits";

// What /api/plan sends back when it works: a tour name and the legends in route order
type Plan = { name: string; legends: { id: string; name: string }[] };

// Each one matches words in our roster taglines, so tapping one always has legends to find.
// A tap only fills the box; the visitor still presses Plan or Enter, so every AI call is on purpose.
const SUGGESTIONS = ["silent-film monsters", "Universal classics", "horror writers", "Dracula connections"];

export default function TourPlanner({ narratorLabel }: { narratorLabel: string }) {
  const [wish, setWish] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  // Numbers each request. An answer is shown only if it's still the newest, so a slow, older answer
  // can never replace a newer one (or appear after the text has changed).
  const latestRequest = useRef(0);

  async function planTour(event: FormEvent) {
    event.preventDefault();
    if (planning || !wish.trim()) return; // Enter can submit even when the button is disabled, so check here too
    const requestId = ++latestRequest.current;
    setPlan(null);
    setError(null);
    setPlanning(true); // the button is disabled while planning, so only one AI call runs at a time
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: wish }),
      });
      const data = await res.json();
      if (requestId !== latestRequest.current) return; // a newer request or new text took over: ignore this answer
      if (res.ok) setPlan(data);
      else setError(data.error ?? "Mortimer lost the map. Try again in a moment."); // the server's friendly message
    } catch {
      if (requestId !== latestRequest.current) return;
      setError("The hearse broke down. Try again in a moment."); // network failure or a non-JSON reply
    } finally {
      if (requestId === latestRequest.current) setPlanning(false);
    }
  }

  // ANY text change (typing, deleting, a chip, or ✕) clears the old route and error, so the list always
  // matches the box. It also retires any request still running, so its answer can't show up later.
  function changeWish(text: string) {
    setWish(text);
    setError(null);
    setPlan(null);
    latestRequest.current++;
    setPlanning(false);
  }

  // Chip: fill the box and put the cursor there, ready for Plan or Enter
  function pickSuggestion(text: string) {
    changeWish(text);
    boxRef.current?.focus();
  }

  // Enter plans the tour; Shift+Enter still adds a new line. isComposing skips Enter while typing in IME languages.
  function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <section>
      <h2 className="mb-2 px-2 font-sign text-sm uppercase tracking-widest text-amber">Plan a tour</h2>
      <form onSubmit={planTour} className="flex flex-col gap-2">
        <div className="relative">
          <textarea
            ref={boxRef}
            value={wish}
            onChange={(event) => changeWish(event.target.value)}
            onKeyDown={submitOnEnter}
            enterKeyHint="go" // phone keyboards show "Go" instead of a return arrow
            maxLength={MAX_REQUEST_CHARS}
            rows={3}
            disabled={planning}
            placeholder="Describe your tour, like 'silent-film monsters'"
            aria-label="Describe your tour"
            aria-describedby="planner-count"
            className="w-full resize-none rounded-2xl border border-rust/60 bg-tar/80 py-2 pl-4 pr-9 text-bone placeholder:text-bone/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber disabled:opacity-60"
          />
          {/* Clear button: shows when there's text or a planned route; a fresh start (text, error, route) */}
          {(wish || plan) && (
            <button
              type="button"
              onClick={() => changeWish("")}
              disabled={planning}
              aria-label="Clear and start over"
              className="absolute right-2 top-2 rounded-full px-2 text-bone/60 transition duration-200 hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber motion-reduce:transition-none"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 px-2">
          <span id="planner-count" className="text-xs text-bone/60">
            {wish.length}/{MAX_REQUEST_CHARS}
          </span>
          <button
            type="submit"
            disabled={planning || !wish.trim()}
            className="rounded-full bg-blood px-4 py-2 font-sign text-bone transition duration-200 hover:shadow-[0_0_16px_rgba(168,18,31,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber disabled:opacity-60 motion-reduce:transition-none"
          >
            {planning ? "Planning…" : "Plan my tour"}
          </button>
        </div>
        {/* Hint appears only while typing, so the empty box stays clean */}
        {wish && !planning && <p className="px-2 text-xs text-bone/40">Press Enter or tap Plan my tour.</p>}

        {/* Suggestion chips: a tap fills the box and focuses it; the visitor presses Plan or Enter */}
        <div className="flex flex-wrap gap-1">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => pickSuggestion(suggestion)}
              disabled={planning}
              className="rounded-full border border-rust/60 bg-tar/80 px-3 py-1 text-xs text-bone transition duration-200 hover:border-amber hover:shadow-[0_0_12px_rgba(242,169,59,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber disabled:opacity-60 motion-reduce:transition-none"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>

      {/* Screen readers hear the result or the error when it appears */}
      <div aria-live="polite">
        {error && <p className="mt-2 px-2 text-sm italic text-amber">{error}</p>}
        {plan && (
          <div className="mt-3 rounded-2xl border border-rust/60 bg-tar/80 p-3 text-bone">
            <p className="font-display text-xl tracking-wide text-blood">{plan.name}</p>
            <ol className="mt-1 list-decimal pl-5 text-sm">
              {plan.legends.map((legend) => (
                <li key={legend.id}>{legend.name}</li>
              ))}
            </ol>
            {/* One narrator choice on the page: the planner uses whatever the picker above says */}
            <p className="mt-2 text-xs text-bone/70">Narrator: {narratorLabel} · change it above</p>
            <p className="mt-1 text-xs text-bone/50">Route picked by AI from our roster</p>
          </div>
        )}
      </div>
    </section>
  );
}
