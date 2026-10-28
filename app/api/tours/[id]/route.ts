// Back end only: GET /api/tours/:id reads a saved tour. DELETE removes it, but only with the creator's delete code.
import { connection } from "next/server";
import { db } from "@/lib/db";
import { DB_DOWN_MESSAGE, TOUR_ID_PATTERN, deleteCodeMatches } from "@/lib/tours";

const NOT_FOUND = "That tour has vanished into the fog.";
type Context = { params: Promise<{ id: string }> }; // Next 16: params arrive as a Promise

export async function GET(_request: Request, { params }: Context) {
  await connection(); // always read fresh from the database, never prerendered at build time
  const { id } = await params;
  if (!TOUR_ID_PATTERN.test(id)) return Response.json({ error: NOT_FOUND }, { status: 404 });

  try {
    // `select` leaves out deleteCodeHash, so the fingerprint never leaves the server
    const tour = await db.tour.findUnique({
      where: { id },
      select: { id: true, name: true, legendIds: true, persona: true, createdAt: true },
    });
    if (!tour) return Response.json({ error: NOT_FOUND }, { status: 404 });
    return Response.json(tour);
  } catch (err) {
    console.error("[api/tours/id] Read failed:", err); // raw error goes to the terminal only
    return Response.json({ error: DB_DOWN_MESSAGE }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const { id } = await params;
  if (!TOUR_ID_PATTERN.test(id)) return Response.json({ error: NOT_FOUND }, { status: 404 });

  // The code travels in a header, not the URL, so it never lands in browser history or server access logs
  const code = request.headers.get("x-delete-code");
  if (!code) return Response.json({ error: "Only the tour's creator can delete it." }, { status: 403 });

  try {
    const tour = await db.tour.findUnique({ where: { id }, select: { deleteCodeHash: true } });
    if (!tour) return Response.json({ error: NOT_FOUND }, { status: 404 });
    if (!deleteCodeMatches(code, tour.deleteCodeHash)) {
      return Response.json({ error: "Only the tour's creator can delete it." }, { status: 403 });
    }
    // deleteMany doesn't throw if a second click already removed it, so a double-click can't cause a 500
    await db.tour.deleteMany({ where: { id } });
    return Response.json({ deleted: true });
  } catch (err) {
    console.error("[api/tours/id] Delete failed:", err); // raw error goes to the terminal only
    return Response.json({ error: DB_DOWN_MESSAGE }, { status: 500 });
  }
}
