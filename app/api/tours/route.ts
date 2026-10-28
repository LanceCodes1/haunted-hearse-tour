// Back end only: POST /api/tours saves a new tour and hands the creator a one-time delete code.
import { db } from "@/lib/db";
import { DB_DOWN_MESSAGE, hashDeleteCode, newDeleteCode, newTourId, validateTour } from "@/lib/tours";

export async function POST(request: Request) {
  // Bad input: a body that isn't JSON gets a friendly message instead of crashing the route
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "That tour didn't come through. Try again." }, { status: 400 });
  }

  // Same rules the AI planner will use, so a saved tour is always valid no matter who built it
  const check = validateTour(body);
  if (!check.ok) return Response.json({ error: check.message }, { status: 400 });

  const deleteCode = newDeleteCode();
  try {
    const tour = await db.tour.create({
      data: { id: newTourId(), ...check.tour, deleteCodeHash: hashDeleteCode(deleteCode) },
      select: { id: true },
    });
    // The plain code is sent this one time and never stored. If the creator loses it, the tour can't be deleted.
    return Response.json({ id: tour.id, deleteCode }, { status: 201 });
  } catch (err) {
    console.error("[api/tours] Create failed:", err); // raw error goes to the terminal only
    return Response.json({ error: DB_DOWN_MESSAGE }, { status: 500 });
  }
}
