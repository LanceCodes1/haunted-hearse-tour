// Server component: the frame around every share page (and its "tour vanished" page): background + title.
// A layout, not part of page.tsx, so the not-found page gets the same frame.
import Image from "next/image";
import Link from "next/link";
import SiteTitle from "../../SiteTitle";

export default function TourLayout({ children }: LayoutProps<"/tour/[id]">) {
  return (
    <div className="relative flex flex-1 flex-col">
      {/* Same cemetery background and dripping header as the home page */}
      <div className="fixed inset-0 -z-10">
        <Image src="/images/background.png" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-tar/75" />
      </div>
      <header className="bg-[url(/images/header-overlay.svg)] bg-cover bg-bottom pb-10 pt-4 md:pb-14">
        <SiteTitle href="/" />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-6">
        {/* A clear way home: the site title also goes home, but visitors from a shared link may not know that */}
        <Link
          href="/"
          className="mb-6 inline-block rounded-full border border-rust/60 bg-tar/80 px-4 py-2 font-sign text-sm text-bone transition duration-200 hover:border-amber hover:shadow-[0_0_12px_rgba(242,169,59,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber motion-reduce:transition-none"
        >
          ← Back to the Hearse
        </Link>
        {children}
      </main>
    </div>
  );
}
