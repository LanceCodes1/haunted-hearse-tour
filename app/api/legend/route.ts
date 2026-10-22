// Back end only: GET /api/legend returns Bela Lugosi's burial facts from Wikidata as JSON.
import { connection } from "next/server";
import { getBurialFacts, WikidataError } from "@/lib/wikidata";

const BELA_LUGOSI_ID = "Q34529"; // checked live on Wikidata (Holy Cross Cemetery)

export async function GET() {
  await connection(); // run on every request, never prerendered at build time

  try {
    const facts = await getBurialFacts(BELA_LUGOSI_ID);
    return Response.json(facts);
  } catch (err) {
    console.error("[api/legend] Wikidata lookup failed:", err); // raw error goes to the terminal only
    if (err instanceof WikidataError) {
      return Response.json({ error: err.userMessage }, { status: err.status });
    }
    return Response.json({ error: "Something went wrong on our side. Try again soon." }, { status: 500 });
  }
}
