// Shown when a share link's tour doesn't exist: never saved, mistyped, or deleted by its creator
import Link from "next/link";

export default function TourNotFound() {
  return (
    <article className="mx-auto max-w-xl rounded-2xl border border-rust/60 bg-tar/90 p-6 text-center text-bone shadow-[0_0_40px_rgba(168,18,31,0.25)]">
      <h2 className="font-display text-3xl tracking-wide text-blood">That tour has vanished into the fog.</h2>
      <p className="mt-2 text-bone/80">Its creator may have deleted it, or the link has a typo.</p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-full bg-blood px-4 py-2 font-sign text-bone transition duration-200 hover:shadow-[0_0_16px_rgba(168,18,31,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber motion-reduce:transition-none"
      >
        Plan your own tour
      </Link>
    </article>
  );
}
