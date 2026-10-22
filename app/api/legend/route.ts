// Back end only: GET /api/legend?id=Q34529 returns a roster legend's burial facts from Wikidata as JSON.
import { connection, type NextRequest } from "next/server";
import { WikidataError } from "@/lib/wikidata";
import { getRosterFacts } from "@/lib/roster";

export async function GET(request: NextRequest) {
  await connection(); // run on every request, never prerendered at build time

  try {
    const facts = await getRosterFacts(request.nextUrl.searchParams.get("id")); // ?id= must be on the roster
    return Response.json(facts);
  } catch (err) {
    console.error("[api/legend] Lookup failed:", err); // raw error goes to the terminal only
    if (err instanceof WikidataError) {
      return Response.json({ error: err.userMessage }, { status: err.status });
    }
    return Response.json({ error: "Something went wrong on our side. Try again soon." }, { status: 500 });
  }
}
